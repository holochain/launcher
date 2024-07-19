use hc_seed_bundle::UnlockedSeedBundle;
use std::time::SystemTime;


#[napi(object)]
pub struct KeyFile {
    pub root_seed: String,
    pub revocation_key: String,
    pub device_key: String,
    pub timestamp: f64,
}

/// Generates root seed, revocation key and device seed
///
/// Use a single passphrase for the whole file for starters
#[napi]
pub async fn generate_seeds(passphrase: String) -> napi::Result<KeyFile> {
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

    let root_seed_b64 = base64::encode(root_seed_encrypted);

    // Derive, encrypt and base64 encode revocation key
    let revocation_key = root_seed
        .derive(0)
        .await
        .map_err(|e| napi::Error::from_reason(format!("Failed to derive revocation key: {}", e)))?;

    let revocation_key_encrypted = revocation_key
        .lock()
        .add_pwhash_cipher(passphrase.as_bytes().to_owned())
        .lock()
        .await
        .map_err(|e| napi::Error::from_reason(format!("Failed to encrypt root seed: {}", e)))?;

    let revocation_key_b64 = base64::encode(revocation_key_encrypted);

    // Derive, encrypt and base64 encode device key

    let device_key = root_seed
        .derive(1)
        .await
        .map_err(|e| napi::Error::from_reason(format!("Failed to derive device key: {}", e)))?;

    // print public key to later check that it has been installed correctly into lairs
    let device_pub_key = device_key.get_sign_pub_key().read_lock().to_vec();
    let device_pub_key_b64 = base64::encode(device_pub_key);
    println!("Device public key: {}", device_pub_key_b64);

    let device_key_encrypted = revocation_key
        .lock()
        .add_pwhash_cipher(passphrase.as_bytes().to_owned())
        .lock()
        .await
        .map_err(|e| napi::Error::from_reason(format!("Failed to encrypt root seed: {}", e)))?;

    let device_key_b64 = base64::encode(device_key_encrypted);


    let timestamp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|e| {
            napi::Error::from_reason(format!("Failed to get system time since Unix epoch: {}", e))
        })?;



    Ok(KeyFile {
        root_seed: root_seed_b64,
        revocation_key: revocation_key_b64,
        device_key: device_key_b64,
        timestamp: timestamp.as_secs_f64(),
    })
}
