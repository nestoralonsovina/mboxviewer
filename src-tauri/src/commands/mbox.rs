//! Thin Tauri command wrappers for MBOX operations.
//!
//! Each command: extracts input, locks state, delegates to `MboxService`, returns result.
//! No business logic lives here.

use std::path::PathBuf;

use tauri::State;

use crate::error::AppError;
use crate::models::*;
use crate::services::MboxService;
use crate::state::AppState;

/// Open an MBOX file and build/load its index
#[tauri::command]
pub async fn open_mbox(path: String, state: State<'_, AppState>) -> Result<MboxStats, AppError> {
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
pub fn get_emails(
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
pub fn get_email_count(state: State<'_, AppState>) -> usize {
    let entries = state.entries.lock().unwrap();
    entries.len()
}

/// Get a single email's full body
#[tauri::command]
pub fn get_email_body(index: usize, state: State<'_, AppState>) -> Result<EmailBody, AppError> {
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
pub async fn search_emails(
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
pub fn get_emails_by_label(
    label: String,
    state: State<'_, AppState>,
) -> Result<Vec<EmailEntry>, AppError> {
    let entries = state.entries.lock().unwrap();

    let mut service = MboxService::new();
    service.entries = entries.clone();

    service.get_emails_by_label(&label)
}

/// Download an attachment from an email
#[tauri::command]
pub fn get_attachment(
    email_index: usize,
    attachment_index: usize,
    state: State<'_, AppState>,
) -> Result<Vec<u8>, AppError> {
    let entries = state.entries.lock().unwrap();
    let mut store_guard = state.store.lock().unwrap();

    let mut service = MboxService::new();
    service.entries = entries.clone();
    service.store = store_guard.take();

    let result = service.get_attachment(email_index, attachment_index);

    // Return the store to AppState
    *store_guard = service.store.take();

    result
}

/// Close the currently open MBOX file
#[tauri::command]
pub fn close_mbox(state: State<'_, AppState>) -> Result<(), AppError> {
    let mut service = MboxService::new();
    service.mbox_path = state.mbox_path.lock().unwrap().take();
    service.entries = std::mem::take(&mut *state.entries.lock().unwrap());
    service.store = state.store.lock().unwrap().take();

    service.close();

    Ok(())
}

/// Get all unique labels from the MBOX file
#[tauri::command]
pub fn get_labels(state: State<'_, AppState>) -> Result<Vec<LabelCount>, AppError> {
    let entries = state.entries.lock().unwrap();

    let mut service = MboxService::new();
    service.entries = entries.clone();

    Ok(service.get_labels())
}
