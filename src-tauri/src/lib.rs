//! Tauri backend for mboxviewer - wraps mboxshell library for MBOX file operations.

mod commands;
mod error;
mod models;
mod services;
mod state;

use state::AppState;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    Emitter,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(AppState::default())
        .setup(|app| {
            // Create the app menu with Settings
            let settings_item = MenuItem::with_id(app, "settings", "Settings...", true, Some("CmdOrCtrl+,"))?;
            
            let app_submenu = Submenu::with_items(
                app,
                "mboxviewer",
                true,
                &[
                    &PredefinedMenuItem::about(app, Some("About MBOX Viewer"), None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &settings_item,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::services(app, None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::hide(app, None)?,
                    &PredefinedMenuItem::hide_others(app, None)?,
                    &PredefinedMenuItem::show_all(app, None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::quit(app, None)?,
                ],
            )?;

            let file_submenu = Submenu::with_items(
                app,
                "File",
                true,
                &[
                    &PredefinedMenuItem::close_window(app, None)?,
                ],
            )?;

            let edit_submenu = Submenu::with_items(
                app,
                "Edit",
                true,
                &[
                    &PredefinedMenuItem::undo(app, None)?,
                    &PredefinedMenuItem::redo(app, None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::cut(app, None)?,
                    &PredefinedMenuItem::copy(app, None)?,
                    &PredefinedMenuItem::paste(app, None)?,
                    &PredefinedMenuItem::select_all(app, None)?,
                ],
            )?;

            let view_submenu = Submenu::with_items(
                app,
                "View",
                true,
                &[
                    &PredefinedMenuItem::fullscreen(app, None)?,
                ],
            )?;

            let window_submenu = Submenu::with_items(
                app,
                "Window",
                true,
                &[
                    &PredefinedMenuItem::minimize(app, None)?,
                    &PredefinedMenuItem::maximize(app, None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::close_window(app, None)?,
                ],
            )?;

            let menu = Menu::with_items(
                app,
                &[
                    &app_submenu,
                    &file_submenu,
                    &edit_submenu,
                    &view_submenu,
                    &window_submenu,
                ],
            )?;

            app.set_menu(menu)?;

            Ok(())
        })
        .on_menu_event(|app, event| {
            println!("Menu event received: {:?}", event.id());
            if event.id().as_ref() == "settings" {
                println!("Settings menu item clicked, emitting open-preferences event");
                // Emit event to the frontend to open preferences
                match app.emit("open-preferences", ()) {
                    Ok(_) => println!("Event emitted successfully"),
                    Err(e) => eprintln!("Failed to emit event: {:?}", e),
                }
            }
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
