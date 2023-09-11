#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![get_environment_variable])
        .menu(create_menu())
        .on_menu_event(|event| match event.menu_item_id() {
            "toggle_devtools" => {
                if event.window().is_devtools_open() {
                    event.window().close_devtools();
                } else {
                    event.window().open_devtools();
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_environment_variable(name: &str) -> String {
    std::env::var(name).unwrap_or_default()
}

fn create_menu() -> Menu {
    let about_menu = Submenu::new(
        "App",
        Menu::new()
            .add_native_item(MenuItem::Hide)
            .add_native_item(MenuItem::HideOthers)
            .add_native_item(MenuItem::ShowAll)
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("settings", "Settings..."))
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Quit),
    );

    let edit_menu = Submenu::new(
        "Edit",
        Menu::new()
            .add_native_item(MenuItem::Undo)
            .add_native_item(MenuItem::Redo)
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Cut)
            .add_native_item(MenuItem::Copy)
            .add_native_item(MenuItem::Paste)
            .add_native_item(MenuItem::SelectAll),
    );

    let view_menu = Submenu::new(
        "View",
        Menu::new().add_native_item(MenuItem::EnterFullScreen),
    );

    let debug_menu = Submenu::new(
        "Debug",
        Menu::new()
            .add_item(
                CustomMenuItem::new("remote_debugger", "Remote Debugger...").accelerator("F5"),
            )
            .add_item(
                CustomMenuItem::new("load_recording", "Load Recording...")
                    .accelerator("CmdOrCtrl+Shift+O"),
            ),
    );

    let window_menu = Submenu::new(
        "Window",
        Menu::new()
            .add_native_item(MenuItem::Minimize)
            .add_native_item(MenuItem::Zoom),
    );

    let help_menu = Submenu::new(
        "Help",
        Menu::new()
            .add_item(CustomMenuItem::new("Learn More", "Learn More"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new(
                "toggle_devtools",
                "Toggle Developer Tools",
            )),
    );

    Menu::new()
        .add_submenu(about_menu)
        .add_submenu(Submenu::new(
            "File",
            Menu::new()
                .add_item(
                    CustomMenuItem::new("new_project", "New Project").accelerator("CmdOrCtrl+N"),
                )
                .add_native_item(MenuItem::Separator)
                .add_item(
                    CustomMenuItem::new("open_project", "Open Project...")
                        .accelerator("CmdOrCtrl+O"),
                )
                .add_native_item(MenuItem::Separator)
                .add_item(
                    CustomMenuItem::new("save_project", "Save Project").accelerator("CmdOrCtrl+S"),
                )
                .add_item(
                    CustomMenuItem::new("save_project_as", "Save Project As...")
                        .accelerator("CmdOrCtrl+Shift+S"),
                )
                .add_native_item(MenuItem::Separator)
                .add_item(
                    CustomMenuItem::new("export_graph", "Export Graph...")
                        .accelerator("CmdOrCtrl+Shift+E"),
                )
                .add_item(
                    CustomMenuItem::new("import_graph", "Import Graph...")
                        .accelerator("CmdOrCtrl+Shift+I"),
                ),
        ))
        .add_submenu(edit_menu)
        .add_submenu(Submenu::new(
            "Run",
            Menu::new()
                .add_item(CustomMenuItem::new("run", "Run Graph").accelerator("CmdOrCtrl+Enter")),
        ))
        .add_submenu(view_menu)
        .add_submenu(debug_menu)
        .add_submenu(window_menu)
        .add_submenu(help_menu)
}
