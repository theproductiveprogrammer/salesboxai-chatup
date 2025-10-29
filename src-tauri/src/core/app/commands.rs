use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager, Runtime, State};
use tauri_plugin_store::StoreExt;

use super::{
    constants::CONFIGURATION_FILE_NAME, helpers::copy_dir_recursive, models::AppConfiguration,
};
use crate::core::state::AppState;

// Helper function to get app_data_dir with .dev suffix in debug mode
fn get_app_data_dir_with_dev<R: Runtime>(app_handle: &tauri::AppHandle<R>) -> PathBuf {
    let mut path = app_handle.path().app_data_dir().unwrap();

    // In dev mode, append .dev suffix to the path (Tauri v2 doesn't do this automatically)
    if cfg!(debug_assertions) {
        // Clone the last component so we don't hold a reference while mutating
        if let Some(last_component) = path.file_name().and_then(|n| n.to_str()).map(|s| s.to_string()) {
            path.pop(); // Remove the last component
            path.push(format!("{}.dev", last_component)); // Add it back with .dev suffix
        }
    }

    path
}

#[tauri::command]
pub fn get_app_configurations<R: Runtime>(app_handle: tauri::AppHandle<R>) -> AppConfiguration {
    let mut app_default_configuration = AppConfiguration::default();

    if std::env::var("CI").unwrap_or_default() == "e2e" {
        return app_default_configuration;
    }

    let configuration_file = get_configuration_file_path(app_handle.clone());

    let default_data_folder = default_data_folder_path(app_handle.clone());

    if !configuration_file.exists() {
        log::info!(
            "App config not found, creating default config at {:?}",
            configuration_file
        );

        app_default_configuration.data_folder = default_data_folder;

        if let Err(err) = fs::write(
            &configuration_file,
            serde_json::to_string(&app_default_configuration).unwrap(),
        ) {
            log::error!("Failed to create default config: {}", err);
        }

        return app_default_configuration;
    }

    match fs::read_to_string(&configuration_file) {
        Ok(content) => match serde_json::from_str::<AppConfiguration>(&content) {
            Ok(app_configurations) => app_configurations,
            Err(err) => {
                log::error!(
                    "Failed to parse app config, returning default config instead. Error: {}",
                    err
                );
                app_default_configuration
            }
        },
        Err(err) => {
            log::error!(
                "Failed to read app config, returning default config instead. Error: {}",
                err
            );
            app_default_configuration
        }
    }
}

#[tauri::command]
pub fn update_app_configuration(
    app_handle: tauri::AppHandle,
    configuration: AppConfiguration,
) -> Result<(), String> {
    let configuration_file = get_configuration_file_path(app_handle);
    log::info!(
        "update_app_configuration, configuration_file: {:?}",
        configuration_file
    );

    fs::write(
        configuration_file,
        serde_json::to_string(&configuration).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_jan_data_folder_path<R: Runtime>(app_handle: tauri::AppHandle<R>) -> PathBuf {
    if cfg!(test) {
        let path = std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("test-data");
        if !path.exists() {
            let _ = fs::create_dir_all(&path);
        }
        return path;
    }

    let app_configurations = get_app_configurations(app_handle);
    PathBuf::from(app_configurations.data_folder)
}

#[tauri::command]
pub fn get_configuration_file_path<R: Runtime>(app_handle: tauri::AppHandle<R>) -> PathBuf {
    // Use helper function that adds .dev suffix in debug mode
    let app_path = get_app_data_dir_with_dev(&app_handle);

    let package_name = env!("CARGO_PKG_NAME");
    #[cfg(target_os = "linux")]
    let old_data_dir = {
        if let Some(config_path) = dirs::config_dir() {
            config_path.join(package_name)
        } else {
            log::debug!("Could not determine config directory");
            app_path
                .parent()
                .unwrap_or(&app_path.join("../"))
                .join(package_name)
        }
    };

    #[cfg(not(target_os = "linux"))]
    let old_data_dir = app_path
        .parent()
        .unwrap_or(&app_path.join("../"))
        .join(package_name);

    if old_data_dir.exists() {
        return old_data_dir.join(CONFIGURATION_FILE_NAME);
    } else {
        return app_path.join(CONFIGURATION_FILE_NAME);
    }
}

#[tauri::command]
pub fn default_data_folder_path<R: Runtime>(app_handle: tauri::AppHandle<R>) -> String {
    // Use helper function that adds .dev suffix in debug mode
    let mut path = get_app_data_dir_with_dev(&app_handle);
    path.push("data");

    let mut path_str = path.to_str().unwrap().to_string();

    if let Some(stripped) = path.to_str().unwrap().to_string().strip_suffix(".ai.app") {
        path_str = stripped.to_string();
    }

    path_str
}

#[tauri::command]
pub fn get_user_home_path(app: AppHandle) -> String {
    return get_app_configurations(app.clone()).data_folder;
}

#[tauri::command]
pub fn change_app_data_folder(
    app_handle: tauri::AppHandle,
    new_data_folder: String,
) -> Result<(), String> {
    // Get current data folder path
    let current_data_folder = get_jan_data_folder_path(app_handle.clone());
    let new_data_folder_path = PathBuf::from(&new_data_folder);

    // Create the new data folder if it doesn't exist
    if !new_data_folder_path.exists() {
        fs::create_dir_all(&new_data_folder_path)
            .map_err(|e| format!("Failed to create new data folder: {}", e))?;
    }

    // Copy all files from the old folder to the new one
    if current_data_folder.exists() {
        log::info!(
            "Copying data from {:?} to {:?}",
            current_data_folder,
            new_data_folder_path
        );

        // Check if this is a parent directory to avoid infinite recursion
        if new_data_folder_path.starts_with(&current_data_folder) {
            return Err(
                "New data folder cannot be a subdirectory of the current data folder".to_string(),
            );
        }
        copy_dir_recursive(
            &current_data_folder,
            &new_data_folder_path,
            &[".uvx", ".npx"],
        )
        .map_err(|e| format!("Failed to copy data to new folder: {}", e))?;
    } else {
        log::info!("Current data folder does not exist, nothing to copy");
    }

    // Update the configuration to point to the new folder
    let mut configuration = get_app_configurations(app_handle.clone());
    configuration.data_folder = new_data_folder;

    // Save the updated configuration
    update_app_configuration(app_handle, configuration)
}

#[tauri::command]
pub fn app_token(state: State<'_, AppState>) -> Option<String> {
    state.app_token.clone()
}

/// Sync SalesBox API key to Tauri store so Rust can access it
#[tauri::command]
pub fn sync_salesbox_api_key<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    api_key: String,
) -> Result<(), String> {
    let mut store_path = get_jan_data_folder_path(app_handle.clone());
    store_path.push("store.json");

    let store = app_handle
        .store(store_path)
        .map_err(|e| format!("Failed to access store: {}", e))?;

    store.set(
        "salesbox-api-key",
        serde_json::json!({ "state": { "apiKey": api_key }, "version": 0 }),
    );

    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    log::info!("Synced SalesBox API key to Tauri store");
    Ok(())
}

/// Sync SalesBox endpoint to Tauri store so Rust can access it
#[tauri::command]
pub fn sync_salesbox_endpoint<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    endpoint: String,
) -> Result<(), String> {
    let mut store_path = get_jan_data_folder_path(app_handle.clone());
    store_path.push("store.json");

    let store = app_handle
        .store(store_path)
        .map_err(|e| format!("Failed to access store: {}", e))?;

    store.set(
        "salesbox-endpoint",
        serde_json::json!({ "state": { "endpoint": endpoint }, "version": 0 }),
    );

    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    log::info!("Synced SalesBox endpoint to Tauri store");
    Ok(())
}
