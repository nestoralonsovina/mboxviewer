//! Tauri backend for mboxviewer - wraps mboxshell library for MBOX file operations.

mod commands;
mod error;
mod menu;
mod models;
mod services;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(AppState::default())
        .setup(|app| {
            let m = menu::create_menu(app)?;
            app.set_menu(m)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            menu::handle_menu_event(app, &event);
        })
        .invoke_handler(tauri::generate_handler![
            commands::open_mbox,
            commands::get_emails,
            commands::get_email_count,
            commands::get_email_body,
            commands::search_emails,
            commands::get_emails_by_label,
            commands::get_attachment,
            commands::close_mbox,
            commands::get_labels
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
