//! Email-related data transfer objects for frontend IPC.

use mboxshell::model::mail::{MailBody, MailEntry};
use serde::{Deserialize, Serialize};

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
