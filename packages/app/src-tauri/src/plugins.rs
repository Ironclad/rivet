use flate2::read::GzDecoder;
use std::fs::File;
use std::path::Path;
use tar::Archive;
use tauri::InvokeError;

#[tauri::command]
pub fn extract_package_plugin_tarball(path: &str) -> Result<(), InvokeError> {
    let tar_gz = File::open(path).map_err(|e| InvokeError::from(e.to_string()))?;
    let tar = GzDecoder::new(tar_gz);
    let mut archive = Archive::new(tar);

    let dir = Path::new(path).parent().unwrap();
    archive
        .unpack(dir)
        .map_err(|e| InvokeError::from(e.to_string()))?;

    Ok(())
}
