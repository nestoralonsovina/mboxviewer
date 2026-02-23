//! Business logic for MBOX file operations.
//!
//! This module contains zero Tauri dependencies — all business logic
//! is pure Rust, testable without a Tauri runtime.

use std::path::PathBuf;

use mboxshell::model::mail::MailEntry;
use mboxshell::store::reader::MboxStore;

/// Manages the state and operations for an opened MBOX file.
///
/// Holds the parsed mail entries, the file reader (store), and the
/// file path. Designed to be wrapped in a `Mutex` inside `AppState`.
pub struct MboxService {
    mbox_path: Option<PathBuf>,
    entries: Vec<MailEntry>,
    store: Option<MboxStore>,
}

impl MboxService {
    pub fn new() -> Self {
        Self {
            mbox_path: None,
            entries: Vec::new(),
            store: None,
        }
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
}
