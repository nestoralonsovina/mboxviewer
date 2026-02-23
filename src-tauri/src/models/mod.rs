//! Data transfer objects for frontend IPC.

pub mod email;
pub mod stats;

pub use email::{EmailBody, EmailEntry};
pub use stats::{LabelCount, MboxStats, SearchResults};
