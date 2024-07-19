#![deny(clippy::all)]

use std::ops::Deref;

use ed25519_dalek::{Keypair, PublicKey, SecretKey};
use hc_seed_bundle::{LockedSeedCipher, UnlockedSeedBundle};
use holo_hash::{AgentPubKey, AgentPubKeyB64};
use holochain_zome_types::prelude::{Signature, ZomeCallUnsigned};
use lair_keystore_api::{
    dependencies::{sodoken::BufRead, url::Url},
    ipc_keystore::ipc_keystore_connect,
    lair_store::{LairEntryInfo, SeedInfo},
    LairClient,
};
use pinentry::PassphraseInput;
use secrecy::{ExposeSecret, SecretString};

use napi::Result;

use crate::types::*;

struct LauncherLairClient {
    lair_client: LairClient,
}

impl LauncherLairClient {
    /// Connect to lair keystore
    pub async fn new(connection_url: String, passphrase: String) -> Self {
        let connection_url_parsed = Url::parse(connection_url.deref()).unwrap();
        let passphrase_bufread: BufRead = passphrase.as_bytes().into();

        let lair_client = ipc_keystore_connect(connection_url_parsed, passphrase_bufread)
            .await
            .unwrap();

        Self { lair_client }
    }

    /// Sign a zome call
    pub async fn sign_zome_call(
        &self,
        zome_call_unsigned_js: ZomeCallUnsignedNapi,
    ) -> Result<ZomeCallNapi> {
        let zome_call_unsigned: ZomeCallUnsigned = zome_call_unsigned_js.clone().into();
        let pub_key = zome_call_unsigned.provenance.clone();
        let mut pub_key_2 = [0; 32];
        pub_key_2.copy_from_slice(pub_key.get_raw_32());

        let data_to_sign = zome_call_unsigned.data_to_sign().unwrap();

        let sig = self
            .lair_client
            .sign_by_pub_key(pub_key_2.into(), None, data_to_sign)
            .await
            .unwrap();

        let signature = Signature(*sig.0);

        let signed_zome_call = ZomeCallNapi {
            cell_id: zome_call_unsigned_js.cell_id,
            zome_name: zome_call_unsigned.zome_name.to_string(),
            fn_name: zome_call_unsigned.fn_name.0,
            payload: zome_call_unsigned_js.payload,
            cap_secret: zome_call_unsigned_js.cap_secret,
            provenance: zome_call_unsigned_js.provenance,
            nonce: zome_call_unsigned_js.nonce,
            expires_at: zome_call_unsigned_js.expires_at,
            signature: signature.0.to_vec(),
        };

        Ok(signed_zome_call)
    }

    pub async fn import_locked_seed_bundle(
        &self,
        import_locked_seed_bundle: String,
        passphrase: String,
        tag: String,
    ) -> Result<String> {
        let unlocked_seed_bundle = unlock_device_bundle(&import_locked_seed_bundle, passphrase)
            .await
            .map_err(|e| {
                napi::Error::from_reason(format!("Failed to generate random seed: {}", e))
            })?;

        let encryption_key = self.get_or_create_seed("import-encryption-key").await?;
        let decryption_key = self.get_or_create_seed("import-decryption-key").await?;

        let secret = SecretKey::from_bytes(&*unlocked_seed_bundle.get_seed().read_lock())
            .map_err(|e| napi::Error::from_reason(format!("Failed to get seed: {:?}", e)))?;

        // encrypt seed that shall be imported
        let (nonce, cipher) = self
            .lair_client
            .crypto_box_xsalsa_by_pub_key(
                encryption_key.x25519_pub_key.clone(),
                decryption_key.x25519_pub_key.clone(),
                None,
                secret.as_ref().into(),
            )
            .await
            .map_err(|e| {
                napi::Error::from_reason(format!("Failed to encrypt the device_bundle_seed: {}", e))
            })?;

        // import the encrypted seed into lair
        let imported_seed = self
            .lair_client
            .import_seed(
                encryption_key.x25519_pub_key,
                decryption_key.x25519_pub_key,
                None,
                nonce,
                cipher,
                tag.into(),
                false,
            )
            .await
            .map_err(|e| {
                napi::Error::from_reason(format!("Failed to import seed into lair: {}", e))
            })?;

        let imported_pubkey_b64 = AgentPubKeyB64::from(AgentPubKey::from_raw_32(
            imported_seed.ed25519_pub_key.as_ref().to_vec(),
        ));

        Ok(imported_pubkey_b64.to_string())
    }

    /// Reads a json file containing the device bundle and the device derivation path,
    /// then derives the device seed and from it a sub seed at index 1 whose base64 encoded
    /// public part should equal the initial_host_pub_key field.
    pub async fn derive_and_import_seed_from_json_file(&self, path: String) -> Result<String> {
        let json_string = std::fs::read_to_string(path)?;
        let parsed_string: serde_json::Value = serde_json::from_str(&json_string)?;
        let device_bundle = parsed_string["device_bundle"]
            .as_str()
            .ok_or(napi::Error::from_reason(
                "device_bundle value does not seem to be a string",
            ))?
            .to_string();

        let initial_host_pub_key_b64 =
            parsed_string["initial_host_pub_key"]
                .as_str()
                .ok_or(napi::Error::from_reason(
                    "initial_host_pub_key value does not seem to be a string",
                ))?;

        let passphrase = if let Some(mut input) = PassphraseInput::with_default_binary() {
            // pinentry binary is available!
            input
                .with_description("Enter Seed Bundle Passphrase")
                .with_prompt("Passphrase:")
                .interact()
                .map_err(|e| {
                    napi::Error::from_reason(format!("Failed to collect passphrase: {e}"))
                })?
        } else {
            return Err(napi::Error::from_reason(
                "No pinentry binary available to collect the passphrase.",
            ));
        };

        // Unlock the device bundle and derive the sub seed at index 1 which whose public part should
        // correspond to initial_host_pub_key_b64
        let derived_key_pair =
            derive_seed_from_device_bundle(&device_bundle, passphrase, 1).await?;

        let initial_host_pub_key_b64_derived = AgentPubKeyB64::from(AgentPubKey::from_raw_32(
            derived_key_pair.public.as_ref().into(),
        ));

        if initial_host_pub_key_b64 != initial_host_pub_key_b64_derived.to_string() {
            return Err(napi::Error::from_reason(format!("Derived public key does not match the expected public key. Expected {initial_host_pub_key_b64} but derived {initial_host_pub_key_b64_derived}")));
        }

        // Get or generate key for encryption of the seed
        let encryption_key = self.get_or_create_seed("import-encryption-key").await?;
        let decryption_key = self.get_or_create_seed("import-decryption-key").await?;

        // encrypt seed that shall be imported
        let (nonce, cipher) = self
            .lair_client
            .crypto_box_xsalsa_by_pub_key(
                encryption_key.x25519_pub_key.clone(),
                decryption_key.x25519_pub_key.clone(),
                None,
                derived_key_pair.secret.as_ref().into(),
            )
            .await
            .map_err(|e| {
                napi::Error::from_reason(format!("Failed to encrypt the device_bundle_seed: {}", e))
            })?;

        let src_tag = format!("imported#{initial_host_pub_key_b64_derived}");

        // import the encrypted seed into lair
        let imported_seed = self
            .lair_client
            .import_seed(
                encryption_key.x25519_pub_key,
                decryption_key.x25519_pub_key,
                None,
                nonce,
                cipher,
                src_tag.clone().into(),
                false,
            )
            .await
            .map_err(|e| {
                napi::Error::from_reason(format!("Failed to import cipher into lair: {}", e))
            })?;

        let imported_pubkey_b64 = AgentPubKeyB64::from(AgentPubKey::from_raw_32(
            imported_seed.ed25519_pub_key.as_ref().to_vec(),
        ));

        if initial_host_pub_key_b64 != imported_pubkey_b64.to_string() {
            return Err(napi::Error::from_reason(format!("Imported public key does not match the expected public key. Expected {initial_host_pub_key_b64} but imported {imported_pubkey_b64}")));
        }

        Ok(imported_pubkey_b64.to_string())
    }

    async fn get_or_create_seed(&self, tag: &str) -> Result<SeedInfo> {
        // Get or generate key for encryption of the seed
        let encryption_key = match self.lair_client.get_entry(tag.into()).await {
            Ok(key) => match key {
                LairEntryInfo::Seed { seed_info, .. } => seed_info,
                _ => {
                    return Err(napi::Error::from_reason(
                        "The import encryption key in lair is of the wrong format.",
                    ))
                }
            },
            Err(_) => self
                .lair_client
                .new_seed(tag.into(), None, false)
                .await
                .map_err(|e| {
                    napi::Error::from_reason(format!(
                        "Failed to create new import encryption key in lair: {}",
                        e
                    ))
                })?,
        };

        Ok(encryption_key)
    }
}

#[napi(js_name = "LauncherLairClient")]
pub struct JsLauncherLairClient {
    launcher_lair_client: Option<LauncherLairClient>,
}

#[napi]
impl JsLauncherLairClient {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            launcher_lair_client: None,
        }
    }

    #[napi]
    pub async fn connect(connection_url: String, passphrase: String) -> Self {
        let launcher_lair_client = LauncherLairClient::new(connection_url, passphrase).await;

        JsLauncherLairClient {
            launcher_lair_client: Some(launcher_lair_client),
        }
    }

    #[napi]
    pub async fn sign_zome_call(
        &self,
        zome_call_unsigned_js: ZomeCallUnsignedNapi,
    ) -> Result<ZomeCallNapi> {
        self.launcher_lair_client
            .as_ref()
            .unwrap()
            .sign_zome_call(zome_call_unsigned_js)
            .await
    }

    #[napi]
    pub async fn import_locked_seed_bundle(
        &self,
        import_locked_seed_bundle: String,
        passphrase: String,
        tag: String,
    ) -> Result<String> {
        self.launcher_lair_client
            .as_ref()
            .unwrap()
            .import_locked_seed_bundle(import_locked_seed_bundle, passphrase, tag)
            .await
    }

    #[napi]
    pub async fn derive_and_import_seed_from_json_file(&self, path: String) -> Result<String> {
        self.launcher_lair_client
            .as_ref()
            .unwrap()
            .derive_and_import_seed_from_json_file(path)
            .await
    }
}

/// Unlocks the device bundle seed with the given passphrase, then derives
/// a sub SeedBundle by the given index and returns the corresponding derived KeyPair
pub async fn derive_seed_from_device_bundle(
    device_bundle: &String,
    passphrase: SecretString,
    index: u32,
) -> napi::Result<Keypair> {
    let locked_bundle = base64::decode(device_bundle).map_err(|e| {
        napi::Error::from_reason(format!("Failed to decode device bundle: {:?}", e))
    })?;
    match UnlockedSeedBundle::from_locked(&locked_bundle)
        .await
        .map_err(|e| {
            napi::Error::from_reason(format!("Failed to create UnlockedSeedBundle: {:?}", e))
        })?
        .remove(0)
    {
        LockedSeedCipher::PwHash(bundle) => {
            let passphrase_bufread = BufRead::from(passphrase.expose_secret().as_bytes());
            let seed = bundle.unlock(passphrase_bufread).await.map_err(|e| {
                napi::Error::from_reason(format!(
                    "Failed to unlock cipher with the given passphrase: {:?}",
                    e
                ))
            })?;
            let derived_seed = seed.derive(index).await.unwrap();

            Ok(Keypair {
                public: PublicKey::from_bytes(&*derived_seed.get_sign_pub_key().read_lock())
                    .map_err(|e| {
                        napi::Error::from_reason(format!("Failed to get public key: {:?}", e))
                    })?,
                secret: SecretKey::from_bytes(&*derived_seed.get_seed().read_lock()).map_err(
                    |e| napi::Error::from_reason(format!("Failed to get seed: {:?}", e)),
                )?,
            })
        }
        _ => Err(napi::Error::from_reason(
            "Unsupported LockedSeedCipher variant".to_string(),
        )),
    }
}

pub async fn unlock_device_bundle(
    device_bundle: &String,
    passphrase: String,
) -> napi::Result<UnlockedSeedBundle> {
    let locked_bundle = base64::decode(device_bundle).map_err(|e| {
        napi::Error::from_reason(format!("Failed to decode device bundle: {:?}", e))
    })?;
    match UnlockedSeedBundle::from_locked(&locked_bundle)
        .await
        .map_err(|e| {
            napi::Error::from_reason(format!("Failed to create UnlockedSeedBundle: {:?}", e))
        })?
        .remove(0)
    {
        LockedSeedCipher::PwHash(bundle) => {
            let passphrase_bufread = BufRead::from(passphrase.as_bytes());
            let seed = bundle.unlock(passphrase_bufread).await.map_err(|e| {
                napi::Error::from_reason(format!(
                    "Failed to unlock cipher with the given passphrase: {:?}",
                    e
                ))
            })?;

            Ok(seed)
        }
        _ => Err(napi::Error::from_reason(
            "Unsupported LockedSeedCipher variant".to_string(),
        )),
    }
}


