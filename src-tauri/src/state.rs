//! Application state management for mboxviewer.

use std::sync::Mutex;

use crate::services::MboxService;

/// Application state wrapping the MBOX service in a thread-safe mutex.
///
/// Commands lock `service` to access all MBOX operations.
pub struct AppState {
    pub service: Mutex<MboxService>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            service: Mutex::new(MboxService::new()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_service_is_not_open() {
        let state = AppState::default();
        let service = state.service.lock().unwrap();
        assert!(!service.is_open());
    }

    #[test]
    fn default_service_has_zero_emails() {
        let state = AppState::default();
        let service = state.service.lock().unwrap();
        assert_eq!(service.get_email_count(), 0);
    }
}
