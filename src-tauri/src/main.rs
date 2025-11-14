// Kiacha OS - Tauri Main Application
// 
// Single executable application with embedded assets
// No external dependencies, completely portable

#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use kiacha_os::embed::AssetStore;
use kiacha_os::{init, version};
use std::sync::{Arc, Mutex};
use tauri::{
    api::path::BaseDirectory, generate_context, generate_handler, ipc::InvokeMessage, Builder,
    CustomMenuItem, Menu, MenuEntry, Submenu, WindowMenuEvent,
};

// Application state
pub struct AppState {
    asset_store: Arc<AssetStore>,
}

// IPC Commands

#[tauri::command]
fn get_app_info() -> String {
    format!("Kiacha OS v{}", version())
}

#[tauri::command]
fn get_assets_list(state: tauri::State<'_, AppState>) -> Vec<String> {
    state
        .asset_store
        .list_assets()
        .iter()
        .map(|s| s.to_string())
        .collect()
}

#[tauri::command]
async fn invoke_brain_query(
    query: String,
    context: Option<String>,
) -> Result<String, String> {
    // Route to Kiacha Brain via HTTP
    // This will connect to Brain running on localhost:3001
    
    #[cfg(debug_assertions)]
    {
        println!("[KIACHA] Query received: {}", query);
    }
    
    Ok(format!("Query processed: {}", query))
}

#[tauri::command]
fn get_system_info() -> String {
    use std::env;
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    format!("OS: {}, Architecture: {}", os, arch)
}

fn main() {
    init();
    
    // Create asset store
    let asset_store = Arc::new(AssetStore::new());
    
    let app_state = AppState {
        asset_store: asset_store.clone(),
    };
    
    // Build menu
    let menu = create_menu();
    
    // Create Tauri app
    let _app = Builder::default()
        .manage(app_state)
        .menu(menu)
        .on_menu_event(handle_menu_event)
        .invoke_handler(generate_handler![
            get_app_info,
            get_assets_list,
            invoke_brain_query,
            get_system_info,
        ])
        .setup(|app| {
            // Setup custom protocol for embedded assets
            let _app_handle = app.handle();
            
            #[cfg(debug_assertions)]
            {
                // In debug mode, open developer tools
                if let Some(window) = app.get_window("main") {
                    let _ = window.open_devtools();
                }
            }
            
            Ok(())
        })
        .run(generate_context!())
        .expect("error while running tauri application");
}

/// Create application menu
fn create_menu() -> Menu {
    let file_menu = Submenu::new(
        "File",
        Menu::new()
            .add_item(CustomMenuItem::new("exit", "Exit").accelerator("CmdOrCtrl+Q")),
    );
    
    let edit_menu = Submenu::new(
        "Edit",
        Menu::new()
            .add_item(CustomMenuItem::new("undo", "Undo").accelerator("CmdOrCtrl+Z"))
            .add_item(CustomMenuItem::new("redo", "Redo").accelerator("CmdOrCtrl+Shift+Z")),
    );
    
    let view_menu = Submenu::new(
        "View",
        Menu::new()
            .add_item(CustomMenuItem::new("reload", "Reload").accelerator("CmdOrCtrl+R"))
            .add_item(CustomMenuItem::new("dev_tools", "Developer Tools").accelerator("F12")),
    );
    
    let help_menu = Submenu::new(
        "Help",
        Menu::new().add_item(CustomMenuItem::new("about", "About Kiacha OS")),
    );
    
    Menu::new()
        .add_submenu(file_menu)
        .add_submenu(edit_menu)
        .add_submenu(view_menu)
        .add_submenu(help_menu)
}

/// Handle menu events
fn handle_menu_event(event: WindowMenuEvent) {
    match event.menu_item_id() {
        "exit" => {
            std::process::exit(0);
        }
        "reload" => {
            if let Some(window) = event.window().get_window("main") {
                let _ = window.eval("location.reload()");
            }
        }
        "dev_tools" => {
            if let Some(window) = event.window().get_window("main") {
                let _ = window.open_devtools();
            }
        }
        _ => {}
    }
}
