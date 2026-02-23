//! Application state management for mboxviewer.

use std::path::PathBuf;
use std::sync::Mutex;

use mboxshell::model::mail::MailEntry;
use mboxshell::store::reader::MboxStore;

/// Application state holding the currently open MBOX file
pub struct AppState {
    /// Path to the currently open MBOX file
    pub mbox_path: Mutex<Option<PathBuf>>,
    /// Indexed mail entries
    pub entries: Mutex<Vec<MailEntry>>,
    /// MBOX store for reading message bodies
    pub store: Mutex<Option<MboxStore>>,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_has_no_mbox_path() {
        let state = AppState::default();
        let path = state.mbox_path.lock().unwrap();
        assert!(path.is_none());
    }

    #[test]
    fn default_has_empty_entries() {
        let state = AppState::default();
        let entries = state.entries.lock().unwrap();
        assert!(entries.is_empty());
    }

    #[test]
    fn default_has_no_store() {
        let state = AppState::default();
        let store = state.store.lock().unwrap();
        assert!(store.is_none());
    }
}
