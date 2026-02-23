//! Tauri backend for mboxviewer - wraps mboxshell library for MBOX file operations.

mod error;

use std::path::PathBuf;
use std::sync::Mutex;

use mboxshell::index::builder::build_index;
use mboxshell::model::mail::{MailBody, MailEntry};
use mboxshell::search;
use mboxshell::store::reader::MboxStore;
use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    State, Emitter,
};

/// Application state holding the currently open MBOX file
pub struct AppState {
    /// Path to the currently open MBOX file
    mbox_path: Mutex<Option<PathBuf>>,
    /// Indexed mail entries
    entries: Mutex<Vec<MailEntry>>,
    /// MBOX store for reading message bodies
    store: Mutex<Option<MboxStore>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            mbox_path: Mutex::new(None),
            entries: Mutex::new(Vec::new()),
            store: Mutex::new(None),
        }
    }
}

/// Serializable email entry for the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailEntry {
    pub index: usize,
    pub offset: u64,
    pub length: u64,
    pub date: String,
    pub from_name: String,
    pub from_address: String,
    pub to: Vec<EmailAddress>,
    pub cc: Vec<EmailAddress>,
    pub subject: String,
    pub has_attachments: bool,
    pub labels: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailAddress {
    pub name: String,
    pub address: String,
}

/// Serializable email body for the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailBody {
    pub text: Option<String>,
    pub html: Option<String>,
    pub raw_headers: String,
    pub attachments: Vec<AttachmentInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentInfo {
    pub filename: String,
    pub content_type: String,
    pub size: u64,
    pub part_index: usize,
}

/// Statistics about the opened MBOX file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MboxStats {
    pub total_messages: usize,
    pub total_with_attachments: usize,
    pub labels: Vec<LabelCount>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LabelCount {
    pub label: String,
    pub count: usize,
}

/// Progress update for indexing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexProgress {
    pub bytes_read: u64,
    pub total_bytes: u64,
    pub percent: f32,
}

impl From<&MailEntry> for EmailEntry {
    fn from(entry: &MailEntry) -> Self {
        Self {
            index: entry.sequence as usize,
            offset: entry.offset,
            length: entry.length,
            date: entry.date.to_rfc3339(),
            from_name: entry.from.display_name.clone(),
            from_address: entry.from.address.clone(),
            to: entry
                .to
                .iter()
                .map(|a| EmailAddress {
                    name: a.display_name.clone(),
                    address: a.address.clone(),
                })
                .collect(),
            cc: entry
                .cc
                .iter()
                .map(|a| EmailAddress {
                    name: a.display_name.clone(),
                    address: a.address.clone(),
                })
                .collect(),
            subject: entry.subject.clone(),
            has_attachments: entry.has_attachments,
            labels: entry.labels.clone(),
        }
    }
}

impl From<&MailBody> for EmailBody {
    fn from(body: &MailBody) -> Self {
        Self {
            text: body.text.clone(),
            html: body.html.clone(),
            raw_headers: body.raw_headers.clone(),
            attachments: body
                .attachments
                .iter()
                .enumerate()
                .map(|(i, a)| AttachmentInfo {
                    filename: a.filename.clone(),
                    content_type: a.content_type.clone(),
                    size: a.size,
                    part_index: i,
                })
                .collect(),
        }
    }
}

/// Open an MBOX file and build/load its index
#[tauri::command]
async fn open_mbox(path: String, state: State<'_, AppState>) -> Result<MboxStats, String> {
    let path_buf = PathBuf::from(&path);

    if !path_buf.exists() {
        return Err(format!("File not found: {}", path));
    }

    // Build or load the index
    let mut entries = build_index(&path_buf, false, None).map_err(|e| e.to_string())?;

    // Sort by date, most recent first
    entries.sort_by(|a, b| b.date.cmp(&a.date));

    // Reassign sequence numbers after sorting to maintain correct indexing
    for (i, entry) in entries.iter_mut().enumerate() {
        entry.sequence = i as u64;
    }

    // Open the store for reading message bodies
    let store = MboxStore::open(&path_buf).map_err(|e| e.to_string())?;

    // Calculate statistics
    let total_messages = entries.len();
    let total_with_attachments = entries.iter().filter(|e| e.has_attachments).count();

    // Count labels
    let mut label_counts: std::collections::HashMap<String, usize> =
        std::collections::HashMap::new();
    for entry in &entries {
        for label in &entry.labels {
            *label_counts.entry(label.clone()).or_insert(0) += 1;
        }
    }
    let mut labels: Vec<LabelCount> = label_counts
        .into_iter()
        .map(|(label, count)| LabelCount { label, count })
        .collect();
    labels.sort_by(|a, b| b.count.cmp(&a.count));

    // Update state
    *state.mbox_path.lock().unwrap() = Some(path_buf);
    *state.entries.lock().unwrap() = entries;
    *state.store.lock().unwrap() = Some(store);

    Ok(MboxStats {
        total_messages,
        total_with_attachments,
        labels,
    })
}

/// Get a paginated list of emails
#[tauri::command]
fn get_emails(
    offset: usize,
    limit: usize,
    state: State<'_, AppState>,
) -> Result<Vec<EmailEntry>, String> {
    let entries = state.entries.lock().unwrap();

    if entries.is_empty() {
        return Err("No MBOX file is currently open".to_string());
    }

    let end = (offset + limit).min(entries.len());
    let result: Vec<EmailEntry> = entries[offset..end].iter().map(EmailEntry::from).collect();

    Ok(result)
}

/// Get the total count of emails
#[tauri::command]
fn get_email_count(state: State<'_, AppState>) -> Result<usize, String> {
    let entries = state.entries.lock().unwrap();
    Ok(entries.len())
}

/// Get a single email's full body
#[tauri::command]
fn get_email_body(index: usize, state: State<'_, AppState>) -> Result<EmailBody, String> {
    let entries = state.entries.lock().unwrap();
    let mut store_guard = state.store.lock().unwrap();

    if entries.is_empty() {
        return Err("No MBOX file is currently open".to_string());
    }

    if index >= entries.len() {
        return Err(format!("Invalid email index: {}", index));
    }

    let store = store_guard
        .as_mut()
        .ok_or("MBOX store not initialized")?;
    let entry = &entries[index];
    let body = store.get_message(entry).map_err(|e| e.to_string())?;

    Ok(EmailBody::from(body))
}

/// Search results with count
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResults {
    pub emails: Vec<EmailEntry>,
    pub total_count: usize,
}

/// Search emails using mboxshell query syntax
/// Supports both metadata search (fast) and body/fulltext search (slower)
#[tauri::command]
async fn search_emails(
    query: String,
    limit: Option<usize>,
    state: State<'_, AppState>,
) -> Result<SearchResults, String> {
    // Clone entries and path to release the lock quickly
    let (entries, mbox_path) = {
        let entries_guard = state.entries.lock().unwrap();
        let path_guard = state.mbox_path.lock().unwrap();
        
        if entries_guard.is_empty() {
            return Err("No MBOX file is currently open".to_string());
        }
        
        let path = path_guard.clone().ok_or("No MBOX file path available")?;
        (entries_guard.clone(), path)
    };

    // Run search in a blocking task to not block the main thread
    let result = tokio::task::spawn_blocking(move || {
        // Use the high-level execute function which handles both metadata and fulltext search
        let (_parsed_query, matching_indices) = search::execute(
            &mbox_path,
            &entries,
            &query,
            None, // No progress callback for now
        ).map_err(|e| e.to_string())?;
        
        let total_count = matching_indices.len();
        
        // Limit results to avoid serialization overhead
        let max_results = limit.unwrap_or(500);
        let results: Vec<EmailEntry> = matching_indices
            .into_iter()
            .take(max_results)
            .map(|i| EmailEntry::from(&entries[i]))
            .collect();

        Ok::<SearchResults, String>(SearchResults {
            emails: results,
            total_count,
        })
    })
    .await
    .map_err(|e| format!("Search task failed: {}", e))??;

    Ok(result)
}

/// Get emails filtered by label
#[tauri::command]
fn get_emails_by_label(label: String, state: State<'_, AppState>) -> Result<Vec<EmailEntry>, String> {
    let entries = state.entries.lock().unwrap();

    if entries.is_empty() {
        return Err("No MBOX file is currently open".to_string());
    }

    let results: Vec<EmailEntry> = entries
        .iter()
        .filter(|e| e.labels.iter().any(|l| l.eq_ignore_ascii_case(&label)))
        .map(EmailEntry::from)
        .collect();

    Ok(results)
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
fn get_labels(state: State<'_, AppState>) -> Result<Vec<LabelCount>, String> {
    let entries = state.entries.lock().unwrap();

    let mut label_counts: std::collections::HashMap<String, usize> =
        std::collections::HashMap::new();
    for entry in entries.iter() {
        for label in &entry.labels {
            *label_counts.entry(label.clone()).or_insert(0) += 1;
        }
    }

    let mut labels: Vec<LabelCount> = label_counts
        .into_iter()
        .map(|(label, count)| LabelCount { label, count })
        .collect();
    labels.sort_by(|a, b| b.count.cmp(&a.count));

    Ok(labels)
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
