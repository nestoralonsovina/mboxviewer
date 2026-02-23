//! Tauri backend for mboxviewer - wraps mboxshell library for MBOX file operations.

mod error;
mod models;
mod services;
mod state;

use std::path::PathBuf;

use error::AppError;
use models::*;
use services::MboxService;
use state::AppState;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    State, Emitter,
};

/// Open an MBOX file and build/load its index
#[tauri::command]
async fn open_mbox(path: String, state: State<'_, AppState>) -> Result<MboxStats, AppError> {
    let path_buf = PathBuf::from(&path);

    let mut service = MboxService::new();
    let stats = service.open(&path_buf)?;

    // Transfer ownership from service to AppState
    *state.mbox_path.lock().unwrap() = service.mbox_path.take();
    *state.entries.lock().unwrap() = std::mem::take(&mut service.entries);
    *state.store.lock().unwrap() = service.store.take();

    Ok(stats)
}

/// Get a paginated list of emails
#[tauri::command]
fn get_emails(
    offset: usize,
    limit: usize,
    state: State<'_, AppState>,
) -> Result<Vec<EmailEntry>, AppError> {
    let entries = state.entries.lock().unwrap();

    if entries.is_empty() {
        return Err(AppError::Validation(
            "No MBOX file is currently open".to_string(),
        ));
    }

    let end = (offset + limit).min(entries.len());
    let result: Vec<EmailEntry> = entries[offset..end].iter().map(EmailEntry::from).collect();

    Ok(result)
}

/// Get the total count of emails
#[tauri::command]
fn get_email_count(state: State<'_, AppState>) -> usize {
    let entries = state.entries.lock().unwrap();
    entries.len()
}

/// Get a single email's full body
#[tauri::command]
fn get_email_body(index: usize, state: State<'_, AppState>) -> Result<EmailBody, AppError> {
    let entries = state.entries.lock().unwrap();
    let mut store_guard = state.store.lock().unwrap();

    if entries.is_empty() {
        return Err(AppError::Validation(
            "No MBOX file is currently open".to_string(),
        ));
    }

    if index >= entries.len() {
        return Err(AppError::Validation(format!(
            "Invalid email index: {index}"
        )));
    }

    let store = store_guard
        .as_mut()
        .ok_or_else(|| AppError::Validation("MBOX store not initialized".to_string()))?;
    let entry = &entries[index];
    let body = store
        .get_message(entry)
        .map_err(|e| AppError::MboxShell(e.to_string()))?;

    Ok(EmailBody::from(body))
}

/// Search emails using mboxshell query syntax
/// Supports both metadata search (fast) and body/fulltext search (slower)
#[tauri::command]
async fn search_emails(
    query: String,
    limit: Option<usize>,
    state: State<'_, AppState>,
) -> Result<SearchResults, AppError> {
    // Clone entries and path to release the lock quickly
    let service = {
        let entries_guard = state.entries.lock().unwrap();
        let path_guard = state.mbox_path.lock().unwrap();

        let mut svc = MboxService::new();
        svc.entries = entries_guard.clone();
        svc.mbox_path = path_guard.clone();
        svc
    };

    // Run search in a blocking task to not block the main thread
    let result = tokio::task::spawn_blocking(move || service.search(&query, limit))
        .await
        .map_err(|e| AppError::MboxShell(format!("Search task failed: {e}")))?;

    result
}

/// Get emails filtered by label
#[tauri::command]
fn get_emails_by_label(label: String, state: State<'_, AppState>) -> Result<Vec<EmailEntry>, AppError> {
    let entries = state.entries.lock().unwrap();

    let mut service = MboxService::new();
    service.entries = entries.clone();

    service.get_emails_by_label(&label)
}

/// Download an attachment from an email
#[tauri::command]
fn get_attachment(
    email_index: usize,
    attachment_index: usize,
    state: State<'_, AppState>,
) -> Result<Vec<u8>, String> {
    let entries = state.entries.lock().unwrap();
    let mut store_guard = state.store.lock().unwrap();

    if entries.is_empty() {
        return Err("No MBOX file is currently open".to_string());
    }

    if email_index >= entries.len() {
        return Err(format!("Invalid email index: {}", email_index));
    }

    let store = store_guard
        .as_mut()
        .ok_or("MBOX store not initialized")?;
    let entry = &entries[email_index];

    // First get the body to access attachment metadata
    let body = store.get_message(entry).map_err(|e| e.to_string())?;

    if attachment_index >= body.attachments.len() {
        return Err(format!("Invalid attachment index: {}", attachment_index));
    }

    // Clone the attachment metadata so we can release the borrow on body
    let attachment_meta = body.attachments[attachment_index].clone();
    
    // Now we can use store again
    let attachment_data = store
        .get_attachment(entry, &attachment_meta)
        .map_err(|e| e.to_string())?;

    Ok(attachment_data)
}

/// Close the currently open MBOX file
#[tauri::command]
fn close_mbox(state: State<'_, AppState>) -> Result<(), String> {
    *state.mbox_path.lock().unwrap() = None;
    *state.entries.lock().unwrap() = Vec::new();
    *state.store.lock().unwrap() = None;
    Ok(())
}

/// Get all unique labels from the MBOX file
#[tauri::command]
fn get_labels(state: State<'_, AppState>) -> Result<Vec<LabelCount>, AppError> {
    let entries = state.entries.lock().unwrap();

    let mut service = MboxService::new();
    service.entries = entries.clone();

    Ok(service.get_labels())
}

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
            open_mbox,
            get_emails,
            get_email_count,
            get_email_body,
            search_emails,
            get_emails_by_label,
            get_attachment,
            close_mbox,
            get_labels
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
