//! Data transfer objects for frontend IPC.

pub mod email;
pub mod stats;

pub use email::{AttachmentInfo, EmailAddress, EmailBody, EmailEntry};
pub use stats::{IndexProgress, LabelCount, MboxStats, SearchResults};
