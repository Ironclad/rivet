#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{CustomMenuItem, Menu, Submenu};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .menu(create_menu())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn create_menu() -> Menu {
    Menu::new()
        .add_submenu(Submenu::new(
            "Rivet",
            Menu::new()
                .add_item(CustomMenuItem::new("settings".to_string(), "Settings..."))
                .add_native_item(tauri::MenuItem::Separator)
                .add_item(
                    CustomMenuItem::new("quit".to_string(), "Quit").accelerator("CmdOrCtrl+Q"),
                ),
        ))
        .add_submenu(Submenu::new(
            "File",
            Menu::new()
                .add_item(
                    CustomMenuItem::new("new_project".to_string(), "New Project")
                        .accelerator("CmdOrCtrl+N"),
                )
                .add_native_item(tauri::MenuItem::Separator)
                .add_item(
                    CustomMenuItem::new("open_project".to_string(), "Open Project...")
                        .accelerator("CmdOrCtrl+O"),
                )
                .add_native_item(tauri::MenuItem::Separator)
                .add_item(
                    CustomMenuItem::new("save_project".to_string(), "Save Project")
                        .accelerator("CmdOrCtrl+S"),
                )
                .add_item(
                    CustomMenuItem::new("save_project_as".to_string(), "Save Project As...")
                        .accelerator("CmdOrCtrl+Shift+S"),
                )
                .add_native_item(tauri::MenuItem::Separator)
                .add_item(
                    CustomMenuItem::new("export_graph".to_string(), "Export Graph...")
                        .accelerator("CmdOrCtrl+Shift+E"),
                )
                .add_item(
                    CustomMenuItem::new("import_graph".to_string(), "Import Graph...")
                        .accelerator("CmdOrCtrl+Shift+I"),
                ),
        ))
        .add_submenu(Submenu::new(
            "Run",
            Menu::new().add_item(
                CustomMenuItem::new("run".to_string(), "Run Graph").accelerator("CmdOrCtrl+Enter"),
            ),
        ))
}
