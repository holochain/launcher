use std::path::PathBuf;
use std::fs;
use holochain_types::app::AppBundle;
use holochain_types::web_app::WebAppBundle;
use crate::types::HappAndUiBytes;


#[napi]
pub async fn decode_happ_or_webhapp(happ_or_webhapp_bytes: Vec<u8>) -> napi::Result<HappAndUiBytes> {
    decode_bytes(happ_or_webhapp_bytes).await
}

#[napi]
pub async fn read_and_decode_happ_or_webhapp(path: String) -> napi::Result<HappAndUiBytes> {
    let webhapp_bytes = fs::read(path)?;
    decode_bytes(webhapp_bytes).await
}

#[napi]
pub async fn save_webhapp(path: String, ui_target_dir: String) -> napi::Result<String> {
    let webhapp_bytes = fs::read(path)?;
    let web_app_bundle = WebAppBundle::decode(&webhapp_bytes)
        .map_err(|e| napi::Error::from_reason(format!("Failed to decode WebAppBundle: {}", e)))?;

    // extracting happ bundle
    let app_bundle = web_app_bundle.happ_bundle().await
        .map_err(|e| napi::Error::from_reason(format!("Failed to get happ bundle from webapp bundle bytes: {}", e)))?;

    // extracting ui.zip bytes
    let web_ui_zip_bytes = web_app_bundle.web_ui_zip_bytes().await
        .map_err(|e| napi::Error::from_reason(format!("Failed to extract ui zip bytes: {}", e)))?;

    let uid = nanoid::nanoid!(13);
    let happ_path = std::env::temp_dir().join(format!("launcher_app_to_install_{}.happ", uid));

    if !path_exists(&PathBuf::from(ui_target_dir.clone())) {
        fs::create_dir_all(&ui_target_dir)?;
    }

    let ui_zip_path = PathBuf::from(ui_target_dir.clone()).join("ui.zip");

    // unzip and store UI
    fs::write(ui_zip_path.clone(), web_ui_zip_bytes.into_owned().into_inner())
        .map_err(|e| napi::Error::from_reason(format!("Failed to write Web UI Zip file: {}", e)))?;

    let file = fs::File::open(ui_zip_path.clone())
        .map_err(|e| napi::Error::from_reason(format!("Failed to read Web UI Zip file: {}", e)))?;

    unzip_file(file, ui_target_dir.into())
        .map_err(|e| napi::Error::from_reason(format!("Failed to unzip ui.zip: {}", e)))?;

    fs::remove_file(ui_zip_path)
        .map_err(|e| napi::Error::from_reason(format!("Failed to remove ui.zip after unzipping: {}", e)))?;

    app_bundle.write_to_file(&happ_path).await
        .map_err(|e| napi::Error::from_reason(format!("Failed to write .happ file: {}", e)))?;

    let temp_folder_path_string = happ_path.as_os_str().to_str();
    match temp_folder_path_string {
        Some(str) => Ok(str.to_string()),
        None => Err(napi::Error::from_reason("Failed to convert temp folder path to string."))
    }
}

/// Decodes bytes of a happ or webhapp file
pub async fn decode_bytes(bytes: Vec<u8>) -> napi::Result<HappAndUiBytes> {

    let (app_bundle_bytes, maybe_ui_zip_bytes) = match WebAppBundle::decode(&bytes) {
        Ok(web_app_bundle) => {
            // extract happ bundle
            let app_bundle = web_app_bundle.happ_bundle().await
                .map_err(|e| napi::Error::from_reason(format!("Failed to get happ bundle from webapp bundle bytes: {}", e)))?;

            let app_bundle_bytes = app_bundle.encode()
                .map_err(|e| napi::Error::from_reason(format!("Failed to encode AppBundle: {}", e)))?;

            // extracting ui.zip bytes
            let web_ui_zip_bytes = web_app_bundle.web_ui_zip_bytes().await
                .map_err(|e| napi::Error::from_reason(format!("Failed to extract ui zip bytes: {}", e)))?;

            (app_bundle_bytes, Some(web_ui_zip_bytes.to_vec()))
        },
        Err(web_app_decode_error) => {
            // Try to decode happ bundle
            match AppBundle::decode(&bytes) {
                Ok(app_bundle) => {
                    let app_bundle_bytes = app_bundle.encode()
                        .map_err(|e| napi::Error::from_reason(format!("Failed to encode AppBundle: {}", e)))?;
                    (app_bundle_bytes, None)
                },
                Err(app_decode_error) => {
                    return Err(napi::Error::from_reason(format!("Failed to decode bytes to either happ or webhapp bundle. Errors:\n{}\n{}", web_app_decode_error, app_decode_error)))
                }
            }
        }
    };

    Ok(HappAndUiBytes {
        happ_bytes: app_bundle_bytes,
        ui_bytes: maybe_ui_zip_bytes,
    })
}


pub fn path_exists(path: &PathBuf) -> bool {
    std::path::Path::new(path).exists()
}

pub fn unzip_file(reader: fs::File, outpath: PathBuf) -> Result<(), String> {
    let mut archive = match zip::ZipArchive::new(reader) {
        Ok(a) => a,
        Err(e) => return Err(format!("Failed to unpack zip archive: {}", e)),
    };

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).unwrap();
        let outpath = match file.enclosed_name() {
            Some(path) => outpath.join(path).to_owned(),
            None => continue,
    };

    if (&*file.name()).ends_with('/') {
        fs::create_dir_all(&outpath).unwrap();
    } else {
        if let Some(p) = outpath.parent() {
            if !p.exists() {
                fs::create_dir_all(&p).unwrap();
            }
        }
        let mut outfile = fs::File::create(&outpath).unwrap();
        std::io::copy(&mut file, &mut outfile).unwrap();
    }
    }

    Ok(())
}



