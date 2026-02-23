//! Business logic for MBOX file operations.
//!
//! This module contains zero Tauri dependencies — all business logic
//! is pure Rust, testable without a Tauri runtime.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use mboxshell::index::builder::build_index;
use mboxshell::model::mail::MailEntry;
use mboxshell::store::reader::MboxStore;

use crate::error::AppError;
use crate::models::{LabelCount, MboxStats};

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
}
