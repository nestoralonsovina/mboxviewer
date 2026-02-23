# MBOX Viewer — Rust Backend Modularization Prompt

You are modularizing the Tauri 2 Rust backend of an MBOX viewer app. The goal is to transform a monolithic `lib.rs` (516 lines) into a clean, testable module structure.

## How to use this prompt

1. Read `spec.md` in the project root. It defines every task with checkboxes (`[ ]` = pending, `[x]` = done).
2. Find the **first task not marked as done**. That is your task.
3. Execute that task following the rules below.
4. When finished, mark it `[x]` in `spec.md`, commit your changes.
5. Stop. Do not proceed to the next task unless explicitly asked.

## Rules

### Architecture principles

- **Services have zero Tauri dependencies** — The `services/` module never imports `tauri`. Business logic is pure Rust, testable without a Tauri runtime.
- **Commands are thin wrappers** — Extract input, validate, delegate to service, return `Result<T, AppError>`. No business logic in `#[tauri::command]` functions.
- **Proper error types** — Use `thiserror` for domain errors. No more `Result<T, String>`.
- **Single responsibility** — Each module has one clear purpose.

### File organization

Target structure:

```
src-tauri/src/
├── main.rs              # Entry: calls lib::run()
├── lib.rs               # Tauri Builder setup only
├── error.rs             # AppError enum
├── state.rs             # AppState struct
├── menu.rs              # Menu setup
├── models/
│   ├── mod.rs           # Re-exports
│   ├── email.rs         # EmailEntry, EmailAddress, EmailBody, AttachmentInfo
│   └── stats.rs         # MboxStats, LabelCount, IndexProgress, SearchResults
├── services/
│   ├── mod.rs           # Re-exports
│   └── mbox_service.rs  # Business logic (no Tauri)
└── commands/
    ├── mod.rs           # Re-exports
    └── mbox.rs          # Thin command wrappers
```

### Rust conventions

- Use `thiserror` for error enums with `#[derive(Error)]`
- Implement `Serialize` for errors (Tauri IPC requires it)
- Use `#[serde(rename_all = "camelCase")]` for types crossing IPC boundary
- Accept `&str` over `String`, `&Path` over `PathBuf` in function parameters
- Return owned types from functions that produce data
- Use `?` operator for error propagation, never `.unwrap()` in production paths

### Error type pattern

```rust
use thiserror::Error;
use serde::Serialize;

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
```

### Service pattern

```rust
// services/mbox_service.rs — NO tauri imports!
use std::path::Path;
use crate::error::AppError;
use crate::models::{EmailEntry, MboxStats};

pub struct MboxService {
    // internal state
}

impl MboxService {
    pub fn new() -> Self { /* ... */ }
    
    pub fn open(&mut self, path: &Path) -> Result<MboxStats, AppError> {
        // Business logic here
    }
}
```

### Command pattern

```rust
// commands/mbox.rs
use tauri::State;
use crate::error::AppError;
use crate::state::AppState;
use crate::models::MboxStats;

#[tauri::command]
pub async fn open_mbox(
    path: String,
    state: State<'_, AppState>,
) -> Result<MboxStats, AppError> {
    let path = std::path::PathBuf::from(&path);
    let mut service = state.service.lock().unwrap();
    service.open(&path)
}
```

### What NOT to do

- Do not add Tauri imports to services — this is the critical constraint
- Do not change behavior — only reorganize code
- Do not refactor beyond the scope of the current task
- Do not use `.unwrap()` without good reason (prefer `?` or `.expect("reason")`)
- Do not create unnecessary abstractions — keep it simple

## Verification

After every task:

1. `cargo check` must succeed with zero errors
2. For the final task: `cargo build --release` and manual test with `bun run tauri dev`
3. Verify: open file, browse emails, search, view email, download attachment

## Context files

Read these before starting:

- `spec.md` — the full task list
- `AGENTS.md` — project overview, Tauri commands reference
- `src-tauri/src/lib.rs` — current monolithic implementation
- `src-tauri/Cargo.toml` — dependencies

## Key dependencies

| Crate | Purpose |
|-------|---------|
| `tauri` | Framework (commands, state) |
| `mboxshell` | MBOX parsing library |
| `serde` | Serialization for IPC |
| `tokio` | Async runtime |
| `thiserror` | Error derive macro (add this) |

## mboxshell types reference

The backend uses these types from mboxshell:

- `mboxshell::model::mail::MailEntry` — Email metadata
- `mboxshell::model::mail::MailBody` — Email content with attachments
- `mboxshell::store::reader::MboxStore` — Reader for message bodies
- `mboxshell::index::builder::build_index` — Index builder
- `mboxshell::search::execute` — Search function
