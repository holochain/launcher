#![deny(clippy::all)]

use std::ops::Deref;

use ed25519_dalek::{Keypair, PublicKey, SecretKey};
use hc_seed_bundle::{LockedSeedCipher, UnlockedSeedBundle};
use holochain_zome_types::prelude::{Signature, ZomeCallUnsigned};
use lair_keystore_api::{
    dependencies::{sodoken::BufRead, url::Url},
    ipc_keystore::ipc_keystore_connect,
    lair_store::LairEntryInfo,
    LairClient,
};

use napi::Result;

use crate::types::*;

// This is an incomplete type with only the fields that are actually necessary for the launcher case
struct SeedConfig {
    /// This is the Device Seed Bundle as a base64 string which is compatible with lair-keystore >=v0.0.8
    /// And is encoded with a password that will be needed to be used to decrypt it
    device_bundle: String,
    /// Derivation path of the seed in this config that was generated for a Master Seed
    device_derivation_path: String,
    // /1 derivation path of the device bundle base36 encoded
    holoport_id: String,
}

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

    pub async fn import_seed_from_json_file(
        &self,
        path: String,
        tag_appendix: String,
    ) -> Result<()> {
        let json_string = std::fs::read_to_string(path)?;
        let parsed_string: serde_json::Value = serde_json::from_str(&json_string)?;
        println!("Parsed json string: {}", parsed_string);
        let device_bundle = parsed_string["device_bundle"]
            .as_str()
            .ok_or(napi::Error::from_reason(
                "device_bundle value does not seem to be a string",
            ))?
            .to_string();
        println!("Got device_bundle: {device_bundle}");

        let device_derivation_path_str =
            parsed_string["device_derivation_path"]
                .as_str()
                .ok_or(napi::Error::from_reason(
                    "device_derivation_path value does not seem to be a string",
                ))?;

        // ATTN this will only work for single digit derivation paths
        let derivation_path_num =
            u32::from_str_radix(device_derivation_path_str, 10).map_err(|e| {
                napi::Error::from_reason(format!(
                    "Failed to parse device_derivation_path to u8: {}",
                    e
                ))
            })?;

        let derivation_path = vec![derivation_path_num];

        let key_pair = unlock_device_bundle(&device_bundle, String::from("pass")).await?;
        // Get or generate key for encryption of the seed
        let encryption_key = match self
            .lair_client
            .get_entry("import-encryption-key".into())
            .await
        {
            Ok(key) => match key {
                LairEntryInfo::Seed { tag: _, seed_info } => seed_info,
                _ => {
                    return Err(napi::Error::from_reason(
                        "The import encryption key in lair is of the wrong format.",
                    ))
                }
            },
            Err(_) => self
                .lair_client
                .new_seed("import-encryption-key".into(), None, false)
                .await
                .map_err(|e| {
                    napi::Error::from_reason(format!(
                        "Failed to create new import encryption key in lair: {}",
                        e
                    ))
                })?,
        };
        // Get or generate key for decryption of the seed
        let decryption_key = match self
            .lair_client
            .get_entry("import-decryption-key".into())
            .await
        {
            Ok(key) => match key {
                LairEntryInfo::Seed { tag: _, seed_info } => seed_info,
                _ => {
                    return Err(napi::Error::from_reason(
                        "The import decryption key in lair is of the wrong format.",
                    ))
                }
            },
            Err(_) => self
                .lair_client
                .new_seed("import-decryption-key".into(), None, false)
                .await
                .map_err(|e| {
                    napi::Error::from_reason(format!(
                        "Failed to create new import decryption key in lair: {}",
                        e
                    ))
                })?,
        };

        // encrypt device_bundle seed
        let (nonce, cipher) = self
            .lair_client
            .crypto_box_xsalsa_by_pub_key(
                encryption_key.x25519_pub_key.clone(),
                decryption_key.x25519_pub_key.clone(),
                None,
                key_pair.public.as_bytes().to_vec().into(),
            )
            .await
            .map_err(|e| {
                napi::Error::from_reason(format!("Failed to encrypt the device_bundle_seed: {}", e))
            })?;

        let src_tag = format!("imported#{tag_appendix}");

        // import the encrypted seed into lair
        self.lair_client
            .import_seed(
                encryption_key.x25519_pub_key,
                decryption_key.x25519_pub_key,
                None,
                nonce,
                cipher,
                src_tag.clone().into(),
                true,
            )
            .await
            .map_err(|e| {
                napi::Error::from_reason(format!("Failed to import cipher into lair: {}", e))
            })?;

        let dst_tag = format!("imported#derived{device_derivation_path_str}#{tag_appendix}");

        // Derive the seed for the given derivation path
        let seed_info_derived = self
            .lair_client
            .derive_seed(
                src_tag.into(),
                None,
                dst_tag.into(),
                None,
                derivation_path.into(),
            )
            .await
            .map_err(|e| {
                napi::Error::from_reason(format!(
                    "Failed to derive seed from derivation path: {}",
                    e
                ))
            })?;

        let base64_pubkey_x = base64::encode_config(
            seed_info_derived.x25519_pub_key.as_ref(),
            base64::STANDARD_NO_PAD,
        );

        let base64_pubkey_ed = base64::encode_config(
            seed_info_derived.ed25519_pub_key.as_ref(),
            base64::STANDARD_NO_PAD,
        );

        let base36_pubkey_x = base36::encode(
            seed_info_derived.x25519_pub_key.as_ref()
        );

        let base36_pubkey_ed = base36::encode(
            seed_info_derived.ed25519_pub_key.as_ref(),
        );

        println!("got derived base64 x25519 pubkey: {base64_pubkey_x}");
        println!("got derived base64 ed25519 pubkey: {base64_pubkey_ed}");

        println!("got derived base36 x25519 pubkey: {base36_pubkey_x}");
        println!("got derived base36 ed25519 pubkey: {base36_pubkey_ed}");

        Ok(())
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
    pub async fn import_seed_from_json_file(
        &self,
        path: String,
        tag_appendix: String,
    ) -> Result<()> {
        self.launcher_lair_client
            .as_ref()
            .unwrap()
            .import_seed_from_json_file(path, tag_appendix)
            .await
    }
}

/// unlock seed_bundles to access the pub-key and seed
pub async fn unlock_device_bundle(
    device_bundle: &String,
    passphrase: String,
) -> napi::Result<Keypair> {
    let cipher = base64::decode_config(device_bundle, base64::URL_SAFE_NO_PAD).map_err(|e| {
        napi::Error::from_reason(format!("Failed to decode device bundle: {:?}", e))
    })?;
    match UnlockedSeedBundle::from_locked(&cipher)
        .await
        .map_err(|e| {
            napi::Error::from_reason(format!("Failed to create UnlockedSeedBundle: {:?}", e))
        })?
        .remove(0)
    {
        LockedSeedCipher::PwHash(cipher) => {
            let passphrase_bufread = BufRead::from(passphrase.as_bytes());
            let seed = cipher.unlock(passphrase_bufread).await.map_err(|e| {
                napi::Error::from_reason(format!(
                    "Failed to unlock cipher with the given passphrase: {:?}",
                    e
                ))
            })?;
            Ok(Keypair {
                public: PublicKey::from_bytes(&*seed.get_sign_pub_key().read_lock()).map_err(
                    |e| napi::Error::from_reason(format!("Failed to get public key: {:?}", e)),
                )?,
                secret: SecretKey::from_bytes(&*seed.get_seed().read_lock()).map_err(|e| {
                    napi::Error::from_reason(format!("Failed to get seed: {:?}", e))
                })?,
            })
        }
        _ => Err(napi::Error::from_reason("Unsupported Cipher".to_string())),
    }
}

// fn public_key_from_base64<'de, D>(deserializer: D) -> napi::Result<PublicKey>
// where
//     D: Deserializer<'de>,
// {
//     String::deserialize(deserializer)
//         .map_err(|err| {
//             napi::Error::from_reason(format!("Failed to deserialize public key: {:?}", err))
//         })
//         .and_then(|s| {
//             base64::decode_config(&s, base64::STANDARD_NO_PAD).map_err(|err| {
//                 napi::Error::from_reason(format!("Failed to decode public key: {:?}", err))
//             })
//         })
//         .map(|bytes| PublicKey::from_bytes(&bytes))
//         .and_then(|maybe_key| maybe_key.map_err(|err| napi::Error::from_reason(err.to_string())))
// }
