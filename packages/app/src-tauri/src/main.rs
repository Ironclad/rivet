#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::path::{Path, PathBuf};

use tauri::{AppHandle, CustomMenuItem, InvokeError, Manager, Menu, MenuItem, Submenu};
mod plugins;
mod db;

use db::{DbConfig, test_connection, init_db, get_tables};
use anyhow::Result;
use serde::Serialize;
use sqlx::FromRow;
use chrono::{NaiveDateTime, Duration};

#[derive(Debug, Serialize, FromRow)]
struct ChatMessage {
    id: i32,
    #[sqlx(rename = "start_dt")]
    start_dt: NaiveDateTime,
    company_id: String,
    user_id: String,
    chat_id: String,
    function_call: serde_json::Value,
    inputs: serde_json::Value,
    outputs: serde_json::Value,
    #[sqlx(rename = "time_lapsed")]
    time_lapsed: i64, // Store as seconds
}

fn main() {
    // Fix $PATH on MacOS and Linux to include the bashrc/zshrc
    if let Err(err) = fix_path_env::fix() {
        eprintln!("Error fixing $PATH: {}", err);
    }

    std::env::remove_var("_VOLTA_TOOL_RECURSION");

    tauri::Builder::default()
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            get_environment_variable,
            plugins::extract_package_plugin_tarball,
            allow_data_file_scope,
            read_relative_project_file,
            test_db_connection,
            initialize_database,
            fetch_database_tables,
            execute_query
        ])
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
        .setup(|app| {
            if let Some(path) = app.path_resolver().app_local_data_dir() {
                app.fs_scope().allow_directory(path, true)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_environment_variable(name: &str) -> String {
    std::env::var(name).unwrap_or_default()
}

#[tauri::command]
fn allow_data_file_scope(
    app_handle: AppHandle,
    project_file_path: &str,
) -> Result<(), InvokeError> {
    let scope = app_handle.fs_scope();

    let folder_path = Path::new(project_file_path).parent().unwrap();
    let file_name_no_extension = Path::new(project_file_path)
        .file_stem()
        .unwrap()
        .to_str()
        .unwrap();
    let data_file_path = folder_path.join(format!("{}.rivet-data", file_name_no_extension));

    scope.allow_file(&data_file_path)?;

    Ok(())
}

#[tauri::command]
fn read_relative_project_file(
    relative_from: &str,
    project_file_path: &str,
) -> Result<String, InvokeError> {
    let mut source_dir = PathBuf::from(relative_from);
    source_dir.pop();

    if project_file_path.ends_with(".rivet-project") == false {
        return Err(InvokeError::from("Invalid project file path"));
    }

    let full_path = source_dir.join(project_file_path);
    std::fs::read_to_string(full_path).map_err(|_| InvokeError::from("Failed to read file"))
}

#[tauri::command]
async fn test_db_connection(connection_string: String) -> Result<(), String> {
    test_connection(&connection_string)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn initialize_database(connection_string: String) -> Result<(), String> {
    let config = DbConfig { connection_string };
    init_db(config)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn fetch_database_tables() -> Result<Vec<String>, String> {
    get_tables()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn execute_query(query: String) -> Result<Vec<ChatMessage>, String> {
    let pool = db::get_pool().ok_or_else(|| "Database not initialized".to_string())?;
    
    // Modify the query to convert interval to seconds
    let modified_query = query.replace(
        "SELECT * FROM chat_messages",
        "SELECT id, start_dt, company_id, user_id, chat_id, function_call, inputs::jsonb, outputs::jsonb, EXTRACT(EPOCH FROM time_lapsed)::bigint as time_lapsed FROM chat_messages"
    );
    
    sqlx::query_as::<_, ChatMessage>(&modified_query)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())
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
            .add_item(CustomMenuItem::new("get_help", "Get Help"))
            .add_item(
                CustomMenuItem::new("toggle_devtools", "Toggle Developer Tools").accelerator("F12"),
            ),
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
                .add_item(CustomMenuItem::new("run", "Run Graph").accelerator("CmdOrCtrl+Enter"))
                .add_item(CustomMenuItem::new("clear_outputs", "Clear Outputs")),
        ))
        .add_submenu(view_menu)
        .add_submenu(debug_menu)
        .add_submenu(window_menu)
        .add_submenu(help_menu)
}
