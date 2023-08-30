#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    menu::{
        AboutMetadataBuilder, Menu, MenuBuilder, MenuItem, MenuItemBuilder, Submenu, SubmenuBuilder,
    },
    AppHandle, Manager,
};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window::init())
        // .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![get_environment_variable])
        .menu(|app| {
            let about_menu = SubmenuBuilder::new(app, "App")
                .about(Some(
                    AboutMetadataBuilder::new()
                        .name(Some("Rivet"))
                        .website(Some("https://rivet.ironcladapp.com/"))
                        .version(Some("v0.3.0"))
                        .build(),
                ))
                .hide()
                .hide_others()
                .show_all()
                .separator()
                .item(
                    &MenuItemBuilder::new("Settings...")
                        .id("settings")
                        .build(app),
                )
                .separator()
                .quit()
                .build()?;

            let file_menu = SubmenuBuilder::new(app, "File")
                .item(
                    &MenuItemBuilder::new("New Project...")
                        .id("new_project")
                        .accelerator("CmdOrCtrl+N")
                        .build(app),
                )
                .item(
                    &MenuItemBuilder::new("Open Project...")
                        .id("open_project")
                        .accelerator("CmdOrCtrl+O")
                        .build(app),
                )
                .separator()
                .item(
                    &MenuItemBuilder::new("Save Project")
                        .id("save_project")
                        .accelerator("CmdOrCtrl+S")
                        .build(app),
                )
                .item(
                    &MenuItemBuilder::new("Save Project As...")
                        .id("save_project_as")
                        .accelerator("CmdOrCtrl+Shift+S")
                        .build(app),
                )
                .separator()
                .item(
                    &MenuItemBuilder::new("Export Graph...")
                        .id("export_graph")
                        .accelerator("CmdOrCtrl+Shift+E")
                        .build(app),
                )
                .item(
                    &MenuItemBuilder::new("Import Graph...")
                        .id("import_graph")
                        .accelerator("CmdOrCtrl+Shift+I")
                        .build(app),
                )
                .build()?;

            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            let run_menu = SubmenuBuilder::new(app, "Run")
                .item(
                    &MenuItemBuilder::new("Run Graph")
                        .id("run_graph")
                        .accelerator("CmdOrCtrl+Enter")
                        .build(app),
                )
                .item(
                    &MenuItemBuilder::new("Stop Graph")
                        .id("stop_graph")
                        .accelerator("CmdOrCtrl+.")
                        .build(app),
                )
                .build()?;

            let view_menu = SubmenuBuilder::new(app, "View").fullscreen().build()?;

            let debug_menu = SubmenuBuilder::new(app, "Debug")
                .item(
                    &MenuItemBuilder::new("Remote Debugger...")
                        .id("remote_debugger")
                        .accelerator("F5")
                        .build(app),
                )
                .item(
                    &MenuItemBuilder::new("Load Recording...")
                        .id("load_recording")
                        .accelerator("CmdOrCtrl+Shift+O")
                        .build(app),
                )
                .build()?;

            let window_menu = SubmenuBuilder::new(app, "Window").minimize().build()?;

            let help_menu = SubmenuBuilder::new(app, "Help")
                .item(
                    &MenuItemBuilder::new("Learn More...")
                        .id("learn_more")
                        .build(app),
                )
                .item(
                    &MenuItemBuilder::new("Toggle Developer Tools")
                        .id("toggle_devtools")
                        .build(app),
                )
                .build()?;

            MenuBuilder::new(app.app_handle())
                .items(&[
                    &about_menu,
                    &file_menu,
                    &edit_menu,
                    &run_menu,
                    &view_menu,
                    &debug_menu,
                    &window_menu,
                    &help_menu,
                ])
                .build()
        })
        .setup(|app| {
            // app.on_menu_event(|app, event| match event {
            //     "toggle_devtools" => {
            //         if app.get_focused_window().dev() {
            //             app.get_focused_window().close_devtools();
            //         } else {
            //             app.get_focused_window().open_devtools();
            //         }
            //     }
            //     _ => {}
            // });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_environment_variable(name: &str) -> String {
    std::env::var(name).unwrap_or_default()
}
