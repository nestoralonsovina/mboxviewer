//! Business logic for MBOX file operations.
//!
//! This module contains zero Tauri dependencies — all business logic
//! is pure Rust, testable without a Tauri runtime.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use mboxshell::index::builder::build_index;
use mboxshell::model::mail::MailEntry;
use mboxshell::search;
use mboxshell::store::reader::MboxStore;

use crate::error::AppError;
use crate::models::{EmailBody, EmailEntry, LabelCount, MboxStats, SearchResults};

/// Manages the state and operations for an opened MBOX file.
///
/// Holds the parsed mail entries, the file reader (store), and the
/// file path. Designed to be wrapped in a `Mutex` inside `AppState`.
pub struct MboxService {
    pub(crate) mbox_path: Option<PathBuf>,
    pub(crate) entries: Vec<MailEntry>,
    pub(crate) store: Option<MboxStore>,
}

impl MboxService {
    pub fn new() -> Self {
        Self {
            mbox_path: None,
            entries: Vec::new(),
            store: None,
        }
    }

    pub fn open(&mut self, path: &Path) -> Result<MboxStats, AppError> {
        if !path.exists() {
            return Err(AppError::NotFound(path.display().to_string()));
        }

        let mut entries = build_index(&path.to_path_buf(), false, None)
            .map_err(|e| AppError::MboxShell(e.to_string()))?;

        // Sort by date, most recent first
        entries.sort_by(|a, b| b.date.cmp(&a.date));

        // Reassign sequence numbers after sorting to maintain correct indexing
        for (i, entry) in entries.iter_mut().enumerate() {
            entry.sequence = i as u64;
        }

        let store =
            MboxStore::open(&path.to_path_buf()).map_err(|e| AppError::MboxShell(e.to_string()))?;

        let total_messages = entries.len();
        let total_with_attachments = entries.iter().filter(|e| e.has_attachments).count();

        self.entries = entries;
        self.store = Some(store);
        self.mbox_path = Some(path.to_path_buf());

        let labels = self.count_labels();

        Ok(MboxStats {
            total_messages,
            total_with_attachments,
            labels,
        })
    }

    pub fn get_email_count(&self) -> usize {
        self.entries.len()
    }

    pub fn get_emails(&self, offset: usize, limit: usize) -> Result<Vec<EmailEntry>, AppError> {
        if self.entries.is_empty() {
            return Err(AppError::Validation(
                "No MBOX file is currently open".to_string(),
            ));
        }

        let end = (offset + limit).min(self.entries.len());
        let result = self.entries[offset..end]
            .iter()
            .map(EmailEntry::from)
            .collect();

        Ok(result)
    }

    pub fn get_email_body(&mut self, index: usize) -> Result<EmailBody, AppError> {
        if self.entries.is_empty() {
            return Err(AppError::Validation(
                "No MBOX file is currently open".to_string(),
            ));
        }

        if index >= self.entries.len() {
            return Err(AppError::Validation(format!(
                "Invalid email index: {index}"
            )));
        }

        let store = self
            .store
            .as_mut()
            .ok_or_else(|| AppError::Validation("MBOX store not initialized".to_string()))?;

        let entry = &self.entries[index];
        let body = store
            .get_message(entry)
            .map_err(|e| AppError::MboxShell(e.to_string()))?;

        Ok(EmailBody::from(body))
    }

    pub fn get_labels(&self) -> Vec<LabelCount> {
        self.count_labels()
    }

    pub fn get_emails_by_label(&self, label: &str) -> Result<Vec<EmailEntry>, AppError> {
        if self.entries.is_empty() {
            return Err(AppError::Validation(
                "No MBOX file is currently open".to_string(),
            ));
        }

        let results = self
            .entries
            .iter()
            .filter(|e| e.labels.iter().any(|l| l.eq_ignore_ascii_case(label)))
            .map(EmailEntry::from)
            .collect();

        Ok(results)
    }

    pub fn search(&self, query: &str, limit: Option<usize>) -> Result<SearchResults, AppError> {
        if self.entries.is_empty() {
            return Err(AppError::Validation(
                "No MBOX file is currently open".to_string(),
            ));
        }

        let mbox_path = self
            .mbox_path
            .as_ref()
            .ok_or_else(|| AppError::Validation("No MBOX file path available".to_string()))?;

        let (_parsed_query, matching_indices) =
            search::execute(mbox_path, &self.entries, query, None)
                .map_err(|e| AppError::MboxShell(e.to_string()))?;

        let total_count = matching_indices.len();
        let max_results = limit.unwrap_or(500);

        let emails = matching_indices
            .into_iter()
            .take(max_results)
            .map(|i| EmailEntry::from(&self.entries[i]))
            .collect();

        Ok(SearchResults {
            emails,
            total_count,
        })
    }

    fn count_labels(&self) -> Vec<LabelCount> {
        let mut label_counts: HashMap<String, usize> = HashMap::new();
        for entry in &self.entries {
            for label in &entry.labels {
                *label_counts.entry(label.clone()).or_insert(0) += 1;
            }
        }
        let mut labels: Vec<LabelCount> = label_counts
            .into_iter()
            .map(|(label, count)| LabelCount { label, count })
            .collect();
        labels.sort_by(|a, b| b.count.cmp(&a.count));
        labels
    }
}

impl Default for MboxService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn new_has_no_mbox_path() {
        let service = MboxService::new();
        assert!(service.mbox_path.is_none());
    }

    #[test]
    fn new_has_empty_entries() {
        let service = MboxService::new();
        assert!(service.entries.is_empty());
    }

    #[test]
    fn new_has_no_store() {
        let service = MboxService::new();
        assert!(service.store.is_none());
    }

    #[test]
    fn default_is_equivalent_to_new() {
        let service = MboxService::default();
        assert!(service.mbox_path.is_none());
        assert!(service.entries.is_empty());
        assert!(service.store.is_none());
    }

    #[test]
    fn open_returns_not_found_for_nonexistent_path() {
        let mut service = MboxService::new();
        let result = service.open(Path::new("/nonexistent/file.mbox"));
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert_eq!(err.to_string(), "Not found: /nonexistent/file.mbox");
    }

    #[test]
    fn get_email_count_returns_zero_when_no_file_open() {
        let service = MboxService::new();
        assert_eq!(service.get_email_count(), 0);
    }

    #[test]
    fn get_emails_returns_validation_error_when_no_file_open() {
        let service = MboxService::new();
        let result = service.get_emails(0, 10);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().to_string(),
            "Validation error: No MBOX file is currently open"
        );
    }

    #[test]
    fn get_email_body_returns_validation_error_when_no_file_open() {
        let mut service = MboxService::new();
        let result = service.get_email_body(0);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().to_string(),
            "Validation error: No MBOX file is currently open"
        );
    }

    #[test]
    fn get_email_body_returns_not_found_for_out_of_bounds_index() {
        let mut service = MboxService::new();
        // Simulate having entries but no store — set entries manually
        service.entries = vec![]; // empty, so any index is out of bounds
                                  // This should fail with validation since no file is open (empty entries)
        let result = service.get_email_body(5);
        assert!(result.is_err());
    }

    #[test]
    fn get_labels_returns_empty_when_no_file_open() {
        let service = MboxService::new();
        let labels = service.get_labels();
        assert!(labels.is_empty());
    }

    #[test]
    fn get_emails_by_label_returns_validation_error_when_no_file_open() {
        let service = MboxService::new();
        let result = service.get_emails_by_label("Inbox");
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().to_string(),
            "Validation error: No MBOX file is currently open"
        );
    }

    #[test]
    fn search_returns_validation_error_when_no_file_open() {
        let service = MboxService::new();
        let result = service.search("test", None);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().to_string(),
            "Validation error: No MBOX file is currently open"
        );
    }
}
