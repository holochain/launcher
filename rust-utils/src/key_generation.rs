use hc_seed_bundle::UnlockedSeedBundle;
use std::time::SystemTime;

#[napi(object)]
pub struct KeyFile {
    pub root_seed: String,
    pub revocation_seed: String,
    pub device_seeds_seed: String,
    pub revocation_key_0: String,
    pub device_seed_0: String,
    pub timestamp: f64,
}


/// Generates root seed, revocation key and device seed
///
/// Use a single passphrase for the whole file for starters
#[napi]
pub async fn generate_initial_seeds(passphrase: String) -> napi::Result<KeyFile> {
    // Generate, encrypt and base64 encode root seed
    let root_seed = UnlockedSeedBundle::new_random()
        .await
        .map_err(|e| napi::Error::from_reason(format!("Failed to generate random seed: {}", e)))?;

    let root_seed_encrypted = root_seed
        .lock()
        .add_pwhash_cipher(passphrase.as_bytes().to_owned())
        .lock()
        .await
        .map_err(|e| napi::Error::from_reason(format!("Failed to encrypt root seed: {}", e)))?;

    let root_seed_b64 = base64::encode_config(root_seed_encrypted, base64::URL_SAFE_NO_PAD);

    // Derive, encrypt and base64 encode revocation seed
    let revocation_seed = root_seed.derive(0).await.map_err(|e| {
        napi::Error::from_reason(format!("Failed to derive revocation seed: {}", e))
    })?;

    let revocation_seed_encrypted = revocation_seed
        .lock()
        .add_pwhash_cipher(passphrase.as_bytes().to_owned())
        .lock()
        .await
        .map_err(|e| {
            napi::Error::from_reason(format!("Failed to encrypt revocation seed: {}", e))
        })?;

    let revocation_seed_b64 =
        base64::encode_config(revocation_seed_encrypted, base64::URL_SAFE_NO_PAD);

    // Derive, encrypt and base64 encode device seeds seed
    let device_seeds_seed = root_seed.derive(1).await.map_err(|e| {
        napi::Error::from_reason(format!("Failed to derive device seeds seed: {}", e))
    })?;

    let device_seeds_seed_encrypted = device_seeds_seed
        .lock()
        .add_pwhash_cipher(passphrase.as_bytes().to_owned())
        .lock()
        .await
        .map_err(|e| {
            napi::Error::from_reason(format!("Failed to encrypt device seeds seed: {}", e))
        })?;

    let device_seeds_seed_b64 =
        base64::encode_config(device_seeds_seed_encrypted, base64::URL_SAFE_NO_PAD);

    // Derive, encrypt and base64 encode revocation key and device seed for first device
    let revocation_key_0 = revocation_seed
        .derive(0)
        .await
        .map_err(|e| napi::Error::from_reason(format!("Failed to derive revocation key: {}", e)))?;

    let revocation_key_0_encrypted = revocation_key_0
        .lock()
        .add_pwhash_cipher(passphrase.as_bytes().to_owned())
        .lock()
        .await
        .map_err(|e| {
            napi::Error::from_reason(format!("Failed to encrypt revocation key: {}", e))
        })?;

    let revocation_key_0_b64 =
        base64::encode_config(revocation_key_0_encrypted, base64::URL_SAFE_NO_PAD);

    let device_seed_0 = device_seeds_seed
        .derive(0)
        .await
        .map_err(|e| napi::Error::from_reason(format!("Failed to derive device seed: {}", e)))?;

    let device_seed_0_encrypted = device_seed_0
        .lock()
        .add_pwhash_cipher(passphrase.as_bytes().to_owned())
        .lock()
        .await
        .map_err(|e| {
            napi::Error::from_reason(format!("Failed to encrypt device seed: {}", e))
        })?;

    let device_seed_0_b64 =
        base64::encode_config(device_seed_0_encrypted, base64::URL_SAFE_NO_PAD);

    let timestamp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|e| {
            napi::Error::from_reason(format!("Failed to get system time since Unix epoch: {}", e))
        })?;

    Ok(KeyFile {
        root_seed: root_seed_b64,
        revocation_seed: revocation_seed_b64,
        device_seeds_seed: device_seeds_seed_b64,
        revocation_key_0: revocation_key_0_b64,
        device_seed_0: device_seed_0_b64,
        timestamp: timestamp.as_secs_f64(),
    })
}
