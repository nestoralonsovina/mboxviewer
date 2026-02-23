//! Application error types for mboxviewer.

use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("MBOX error: {0}")]
    MboxShell(String),
}

impl Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn not_found_displays_message() {
        let err = AppError::NotFound("email 42".to_string());
        assert_eq!(err.to_string(), "Not found: email 42");
    }

    #[test]
    fn validation_displays_message() {
        let err = AppError::Validation("path is empty".to_string());
        assert_eq!(err.to_string(), "Validation error: path is empty");
    }

    #[test]
    fn mbox_shell_displays_message() {
        let err = AppError::MboxShell("index corrupt".to_string());
        assert_eq!(err.to_string(), "MBOX error: index corrupt");
    }

    #[test]
    fn io_error_converts_from_std_io() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file missing");
        let app_err = AppError::from(io_err);
        assert_eq!(app_err.to_string(), "IO error: file missing");
    }

    #[test]
    fn serializes_as_display_string() {
        let err = AppError::NotFound("test".to_string());
        let json = serde_json::to_string(&err).expect("serialization should succeed");
        assert_eq!(json, "\"Not found: test\"");
    }
}
