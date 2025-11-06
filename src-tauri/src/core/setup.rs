use flate2::read::GzDecoder;
use std::{
    fs::{self, File},
    io::{Read, Write},
    path::PathBuf,
};
use tar::Archive;
use tauri::{App, Emitter, Manager};
use tauri_plugin_store::StoreExt;
// use tokio::sync::Mutex;
// use tokio::time::{sleep, Duration}; // Using tokio::sync::Mutex
//                                     // MCP

// MCP
use super::{
    app::commands::get_jan_data_folder_path, extensions::commands::get_jan_extensions_path,
    mcp::helpers::{run_mcp_commands, start_builtin_salesbox_mcp}, state::AppState,
};

pub fn install_extensions(app: tauri::AppHandle, force: bool) -> Result<(), String> {
    let mut store_path = get_jan_data_folder_path(app.clone());
    store_path.push("store.json");
    let store = app.store(store_path).expect("Store not initialized");
    let stored_version = store
        .get("version")
        .and_then(|v| v.as_str().map(String::from))
        .unwrap_or_default();

    let app_version = app
        .config()
        .version
        .clone()
        .unwrap_or_else(|| "".to_string());

    let extensions_path = get_jan_extensions_path(app.clone());
    let pre_install_path = app
        .path()
        .resource_dir()
        .unwrap()
        .join("resources")
        .join("pre-install");

    let mut clean_up = force;

    // Check IS_CLEAN environment variable to optionally skip extension install
    if std::env::var("IS_CLEAN").is_ok() {
        clean_up = true;
    }
    log::info!(
        "Installing extensions. Clean up: {}, Stored version: {}, App version: {}",
        clean_up,
        stored_version,
        app_version
    );
    if !clean_up && stored_version == app_version && extensions_path.exists() {
        return Ok(());
    }

    // Attempt to remove extensions folder
    if extensions_path.exists() {
        fs::remove_dir_all(&extensions_path).unwrap_or_else(|_| {
            log::info!("Failed to remove existing extensions folder, it may not exist.");
        });
    }

    // Attempt to create it again
    if !extensions_path.exists() {
        fs::create_dir_all(&extensions_path).map_err(|e| e.to_string())?;
    }

    let extensions_json_path = extensions_path.join("extensions.json");
    let mut extensions_list = if extensions_json_path.exists() {
        let existing_data =
            fs::read_to_string(&extensions_json_path).unwrap_or_else(|_| "[]".to_string());
        serde_json::from_str::<Vec<serde_json::Value>>(&existing_data).unwrap_or_else(|_| vec![])
    } else {
        vec![]
    };

    for entry in fs::read_dir(&pre_install_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().map_or(false, |ext| ext == "tgz") {
            log::info!("Installing extension from {:?}", path);
            let tar_gz = File::open(&path).map_err(|e| e.to_string())?;
            let gz_decoder = GzDecoder::new(tar_gz);
            let mut archive = Archive::new(gz_decoder);

            let mut extension_name = None;
            let mut extension_manifest = None;
            extract_extension_manifest(&mut archive)
                .map_err(|e| e.to_string())
                .and_then(|manifest| match manifest {
                    Some(manifest) => {
                        extension_name = manifest["name"].as_str().map(|s| s.to_string());
                        extension_manifest = Some(manifest);
                        Ok(())
                    }
                    None => Err("Manifest is None".to_string()),
                })?;

            let extension_name = extension_name.ok_or("package.json not found in archive")?;
            let extension_dir = extensions_path.join(extension_name.clone());
            fs::create_dir_all(&extension_dir).map_err(|e| e.to_string())?;

            let tar_gz = File::open(&path).map_err(|e| e.to_string())?;
            let gz_decoder = GzDecoder::new(tar_gz);
            let mut archive = Archive::new(gz_decoder);
            for entry in archive.entries().map_err(|e| e.to_string())? {
                let mut entry = entry.map_err(|e| e.to_string())?;
                let file_path = entry.path().map_err(|e| e.to_string())?;
                let components: Vec<_> = file_path.components().collect();
                if components.len() > 1 {
                    let relative_path: PathBuf = components[1..].iter().collect();
                    let target_path = extension_dir.join(relative_path);
                    if let Some(parent) = target_path.parent() {
                        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                    }
                    let _result = entry.unpack(&target_path).map_err(|e| e.to_string())?;
                }
            }

            let main_entry = extension_manifest
                .as_ref()
                .and_then(|manifest| manifest["main"].as_str())
                .unwrap_or("index.js");
            let url = extension_dir.join(main_entry).to_string_lossy().to_string();

            let new_extension = serde_json::json!({
                "url": url,
                "name": extension_name.clone(),
                "origin": extension_dir.to_string_lossy(),
                "active": true,
                "description": extension_manifest
                    .as_ref()
                    .and_then(|manifest| manifest["description"].as_str())
                    .unwrap_or(""),
                "version": extension_manifest
                    .as_ref()
                    .and_then(|manifest| manifest["version"].as_str())
                    .unwrap_or(""),
                "productName": extension_manifest
                    .as_ref()
                    .and_then(|manifest| manifest["productName"].as_str())
                    .unwrap_or(""),
            });

            extensions_list.push(new_extension);

            log::info!("Installed extension to {:?}", extension_dir);
        }
    }
    fs::write(
        &extensions_json_path,
        serde_json::to_string_pretty(&extensions_list).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;

    // Store the new app version
    store.set("version", serde_json::json!(app_version));
    store.save().expect("Failed to save store");

    Ok(())
}

/// Download and install MCP services from remote endpoint
/// Checks version and only downloads if newer version is available
pub async fn install_mcp_from_remote(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;

    // Get API endpoint from store
    let mut store_path = get_jan_data_folder_path(app.clone());
    store_path.push("store.json");

    let store = app.store(store_path).map_err(|e| {
        log::warn!("Store not available for MCP download: {}", e);
        format!("Store not available: {}", e)
    })?;

    let api_endpoint = store
        .get("salesbox-endpoint")
        .and_then(|v| v.get("state").cloned())
        .and_then(|s| s.get("endpoint").cloned())
        .and_then(|e| e.as_str().map(String::from))
        .unwrap_or_else(|| "https://agent.salesbox.ai".to_string());

    log::info!("Checking for MCP updates from: {}", api_endpoint);

    // Get local version
    let data_path = get_jan_data_folder_path(app.clone());
    let mcp_path = data_path.join("mcp-services").join("salesboxai");
    let version_file = mcp_path.join("version.json");

    let local_version = if version_file.exists() {
        fs::read_to_string(&version_file)
            .ok()
            .and_then(|content| serde_json::from_str::<serde_json::Value>(&content).ok())
            .and_then(|v| v["version"].as_str().map(String::from))
            .unwrap_or_else(|| "0.0.0".to_string())
    } else {
        "0.0.0".to_string()
    };

    log::info!("Local MCP version: {}", local_version);

    // Check remote version
    let version_url = format!("{}/mcp/server-info", api_endpoint);
    let client = reqwest::Client::new();

    let remote_info = match client.get(&version_url).send().await {
        Ok(response) => match response.json::<serde_json::Value>().await {
            Ok(info) => info,
            Err(e) => {
                log::warn!("Failed to parse remote version info: {}", e);
                return Ok(()); // Don't fail, just skip update
            }
        },
        Err(e) => {
            log::warn!("Failed to fetch remote version: {}", e);
            return Ok(()); // Don't fail, just skip update
        }
    };

    let remote_version = remote_info["version"]
        .as_str()
        .unwrap_or("0.0.0")
        .to_string();

    let download_url = remote_info["downloadUrl"]
        .as_str()
        .ok_or("Missing downloadUrl in remote response")?
        .to_string();

    log::info!("Remote MCP version: {}", remote_version);
    log::info!("Download URL: {}", download_url);

    // Compare versions (simple string comparison for now)
    if remote_version <= local_version {
        log::info!("MCP is up to date (local: {}, remote: {})", local_version, remote_version);
        return Ok(());
    }

    // Download new version from CDN
    log::info!("Downloading MCP update: {} -> {} from CDN", local_version, remote_version);
    let response = match client.get(&download_url).send().await {
        Ok(r) => r,
        Err(e) => {
            log::error!("Failed to download MCP: {}", e);
            return Err(format!("Download failed: {}", e));
        }
    };

    let bytes = match response.bytes().await {
        Ok(b) => b,
        Err(e) => {
            log::error!("Failed to read MCP download: {}", e);
            return Err(format!("Read failed: {}", e));
        }
    };

    // Save tar.gz temporarily
    let temp_path = data_path.join("mcp-temp.tar.gz");
    let mut file = File::create(&temp_path).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;
    drop(file);

    log::info!("Downloaded MCP to {:?}, extracting...", temp_path);

    // Remove old MCP directory if exists
    if mcp_path.exists() {
        fs::remove_dir_all(&mcp_path).map_err(|e| e.to_string())?;
    }

    // Create MCP directory
    fs::create_dir_all(&mcp_path).map_err(|e| e.to_string())?;

    // Extract tar.gz
    let tar_gz = File::open(&temp_path).map_err(|e| e.to_string())?;
    let tar = GzDecoder::new(tar_gz);
    let mut archive = Archive::new(tar);
    archive.unpack(&mcp_path).map_err(|e| e.to_string())?;

    // Clean up temp file
    fs::remove_file(&temp_path).unwrap_or_default();

    log::info!("✅ MCP updated successfully to version {}", remote_version);

    Ok(())
}

pub fn extract_extension_manifest<R: Read>(
    archive: &mut Archive<R>,
) -> Result<Option<serde_json::Value>, String> {
    let entry = archive
        .entries()
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok()) // Ignore errors in individual entries
        .find(|entry| {
            if let Ok(file_path) = entry.path() {
                let path_str = file_path.to_string_lossy();
                path_str == "package/package.json" || path_str == "package.json"
            } else {
                false
            }
        });

    if let Some(mut entry) = entry {
        let mut content = String::new();
        entry
            .read_to_string(&mut content)
            .map_err(|e| e.to_string())?;

        let package_json: serde_json::Value =
            serde_json::from_str(&content).map_err(|e| e.to_string())?;
        return Ok(Some(package_json));
    }

    Ok(None)
}

pub fn setup_mcp(app: &App) {
    let state = app.state::<AppState>();
    let servers = state.mcp_servers.clone();
    let app_handle: tauri::AppHandle = app.handle().clone();
    tauri::async_runtime::spawn(async move {
        // First, download/update MCP services from remote
        if let Err(e) = install_mcp_from_remote(app_handle.clone()).await {
            log::warn!("Failed to download MCP from remote: {}", e);
        }

        // Then start the built-in SalesboxAI MCP server (if API key is configured)
        if let Err(e) = start_builtin_salesbox_mcp(&app_handle, servers.clone()).await {
            log::warn!("SalesboxAI builtin MCP server not started: {}", e);
        }

        // Finally start other configured MCP servers
        if let Err(e) = run_mcp_commands(&app_handle, servers).await {
            log::error!("Failed to run mcp commands: {}", e);
        }
        app_handle
            .emit("mcp-update", "MCP servers updated")
            .unwrap();
    });
}
