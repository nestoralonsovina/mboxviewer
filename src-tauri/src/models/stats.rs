//! Statistics and search result types for frontend IPC.

use serde::{Deserialize, Serialize};

use super::email::EmailEntry;

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

/// Search results with count
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResults {
    pub emails: Vec<EmailEntry>,
    pub total_count: usize,
}
