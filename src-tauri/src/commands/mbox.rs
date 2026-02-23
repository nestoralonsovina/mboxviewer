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
    let mut service = state.service.lock().unwrap();
    service.open(&path_buf)
}

/// Get a paginated list of emails
#[tauri::command]
pub fn get_emails(
    offset: usize,
    limit: usize,
    state: State<'_, AppState>,
) -> Result<Vec<EmailEntry>, AppError> {
    let service = state.service.lock().unwrap();
    service.get_emails(offset, limit)
}

/// Get the total count of emails
#[tauri::command]
pub fn get_email_count(state: State<'_, AppState>) -> usize {
    let service = state.service.lock().unwrap();
    service.get_email_count()
}

/// Get a single email's full body
#[tauri::command]
pub fn get_email_body(index: usize, state: State<'_, AppState>) -> Result<EmailBody, AppError> {
    let mut service = state.service.lock().unwrap();
    service.get_email_body(index)
}

/// Search emails using mboxshell query syntax
/// Supports both metadata search (fast) and body/fulltext search (slower)
#[tauri::command]
pub async fn search_emails(
    query: String,
    limit: Option<usize>,
    state: State<'_, AppState>,
) -> Result<SearchResults, AppError> {
    // Clone service data to release the lock before blocking
    let snapshot = {
        let service = state.service.lock().unwrap();
        MboxService::snapshot_for_search(&service)
    };

    // Run search in a blocking task to not block the main thread
    let result = tokio::task::spawn_blocking(move || snapshot.search(&query, limit))
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
    let service = state.service.lock().unwrap();
    service.get_emails_by_label(&label)
}

/// Download an attachment from an email
#[tauri::command]
pub fn get_attachment(
    email_index: usize,
    attachment_index: usize,
    state: State<'_, AppState>,
) -> Result<Vec<u8>, AppError> {
    let mut service = state.service.lock().unwrap();
    service.get_attachment(email_index, attachment_index)
}

/// Close the currently open MBOX file
#[tauri::command]
pub fn close_mbox(state: State<'_, AppState>) -> Result<(), AppError> {
    let mut service = state.service.lock().unwrap();
    service.close();
    Ok(())
}

/// Get all unique labels from the MBOX file
#[tauri::command]
pub fn get_labels(state: State<'_, AppState>) -> Result<Vec<LabelCount>, AppError> {
    let service = state.service.lock().unwrap();
    Ok(service.get_labels())
}
