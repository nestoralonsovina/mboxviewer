# Modularize src-tauri/src/lib.rs

## Goal

Refactor the monolithic `lib.rs` (516 lines) into a clean modular structure following Tauri best practices:

- **services/** — Business logic with zero Tauri dependencies
- **commands/** — Thin wrappers that delegate to services
- **models/** — Serializable domain types for IPC
- **state.rs** — Application state management
- **error.rs** — Centralized error handling with thiserror
- **menu.rs** — Menu setup extracted from run()

## Current Problems

1. All code in one file (516 lines) — hard to navigate and test
2. Business logic mixed with Tauri commands — untestable without Tauri runtime
3. No error type — using `String` for errors everywhere
4. Menu setup bloats `run()` function — 80+ lines of menu code
5. `HashMap` imported inline in multiple places
6. Label counting logic duplicated in `open_mbox` and `get_labels`

## Target Structure

```
src-tauri/src/
├── main.rs              # Entry: calls lib::run() (already correct)
├── lib.rs               # Tauri Builder setup only (~30 lines)
├── error.rs             # AppError enum with thiserror
├── state.rs             # AppState struct
├── menu.rs              # Menu setup function
├── models/
│   ├── mod.rs           # Re-exports
│   ├── email.rs         # EmailEntry, EmailAddress, EmailBody, AttachmentInfo
│   └── stats.rs         # MboxStats, LabelCount, IndexProgress, SearchResults
├── services/
│   ├── mod.rs           # Re-exports
│   └── mbox_service.rs  # MboxService with business logic (no Tauri deps)
└── commands/
    ├── mod.rs           # Re-exports, generate_handler! macro
    └── mbox.rs          # Thin command wrappers
```

## Constraints

- Must pass `cargo check` after each task
- Services module MUST NOT import `tauri`
- Commands are thin: extract args, delegate to service, return Result
- All `String` error returns become `Result<T, AppError>`
- Preserve all existing functionality — no behavior changes

---

## Phase 1: Foundation

### 1.1 Create error.rs with AppError enum
- [x] done
- Create `src-tauri/src/error.rs`
- Define `AppError` enum with variants: `NotFound(String)`, `Validation(String)`, `Io(std::io::Error)`, `MboxShell(String)`
- Implement `thiserror::Error` derive
- Implement `Serialize` for Tauri IPC compatibility
- Add `thiserror = "2"` to Cargo.toml dependencies
- Run `cargo check` to verify

### 1.2 Create models/mod.rs and move DTOs
- [x] done
- Create `src-tauri/src/models/` directory
- Create `models/mod.rs` with re-exports
- Create `models/email.rs` with: `EmailEntry`, `EmailAddress`, `EmailBody`, `AttachmentInfo`
- Create `models/stats.rs` with: `MboxStats`, `LabelCount`, `IndexProgress`, `SearchResults`
- Move `From<&MailEntry>` and `From<&MailBody>` impls to respective files
- Update `lib.rs` to use `mod models; use models::*;`
- Run `cargo check` to verify

### 1.3 Create state.rs with AppState
- [x] done
- Create `src-tauri/src/state.rs`
- Move `AppState` struct and `Default` impl
- Keep `use std::sync::Mutex` and necessary mboxshell imports
- Update `lib.rs` to use `mod state; use state::AppState;`
- Run `cargo check` to verify

---

## Phase 2: Extract Services

### 2.1 Create services/mbox_service.rs with MboxService struct
- [x] done
- Create `src-tauri/src/services/` directory
- Create `services/mod.rs`
- Create `services/mbox_service.rs`
- Define `MboxService` struct holding the data currently in `AppState`
- Implement `MboxService::new()` constructor
- CRITICAL: No `tauri` imports in this module
- Run `cargo check` to verify

### 2.2 Move open_mbox logic to MboxService::open
- [x] done
- Add `pub fn open(&mut self, path: &Path) -> Result<MboxStats, AppError>` to `MboxService`
- Move index building, sorting, store opening, stats calculation logic
- Extract label counting to a private helper method `count_labels(&self) -> Vec<LabelCount>`
- Update the command in `lib.rs` to delegate to service
- Run `cargo check` to verify

### 2.3 Move email retrieval logic to MboxService
- [ ] done
- Add `pub fn get_emails(&self, offset: usize, limit: usize) -> Result<Vec<EmailEntry>, AppError>`
- Add `pub fn get_email_count(&self) -> usize`
- Add `pub fn get_email_body(&mut self, index: usize) -> Result<EmailBody, AppError>`
- Update commands in `lib.rs` to delegate
- Run `cargo check` to verify

### 2.4 Move search and filter logic to MboxService
- [ ] done
- Add `pub fn search(&self, query: &str, limit: Option<usize>) -> Result<SearchResults, AppError>`
- Add `pub fn get_emails_by_label(&self, label: &str) -> Result<Vec<EmailEntry>, AppError>`
- Add `pub fn get_labels(&self) -> Vec<LabelCount>`
- Move the `tokio::spawn_blocking` into the command, keep pure logic in service
- Update commands in `lib.rs` to delegate
- Run `cargo check` to verify

### 2.5 Move attachment and close logic to MboxService
- [ ] done
- Add `pub fn get_attachment(&mut self, email_index: usize, attachment_index: usize) -> Result<Vec<u8>, AppError>`
- Add `pub fn close(&mut self)`
- Add `pub fn is_open(&self) -> bool`
- Update commands in `lib.rs` to delegate
- Run `cargo check` to verify

---

## Phase 3: Extract Commands

### 3.1 Create commands/mbox.rs with thin wrappers
- [ ] done
- Create `src-tauri/src/commands/` directory
- Create `commands/mod.rs` with re-exports
- Create `commands/mbox.rs`
- Move all `#[tauri::command]` functions from `lib.rs`
- Commands take `State<'_, AppState>`, delegate to `MboxService` methods
- Each command: validate input, lock state, call service, return result
- Run `cargo check` to verify

### 3.2 Update AppState to hold MboxService
- [ ] done
- Modify `state.rs`: `AppState { service: Mutex<MboxService> }`
- Update all commands to access `state.service.lock()`
- Remove redundant fields from `AppState`
- Run `cargo check` to verify

---

## Phase 4: Extract Menu

### 4.1 Create menu.rs with setup function
- [ ] done
- Create `src-tauri/src/menu.rs`
- Move menu creation logic to `pub fn create_menu(app: &tauri::App) -> Result<Menu<tauri::Wry>, tauri::Error>`
- Move `on_menu_event` handler logic to `pub fn handle_menu_event(app: &tauri::AppHandle, event: &tauri::menu::MenuEvent)`
- Run `cargo check` to verify

### 4.2 Simplify lib.rs run() function
- [ ] done
- `lib.rs` should only:
  - Declare modules: `mod commands; mod error; mod menu; mod models; mod services; mod state;`
  - Use statements for re-exports
  - `pub fn run()` with clean Tauri Builder chain
- Target: ~30 lines total
- Run `cargo check` to verify

---

## Phase 5: Cleanup and Verification

### 5.1 Remove unused imports from all files
- [ ] done
- Run `cargo clippy -- -W unused_imports`
- Fix any warnings
- Run `cargo check` to verify

### 5.2 Add module documentation
- [ ] done
- Add `//!` doc comments to each module explaining its purpose
- `error.rs`: Error types for the application
- `state.rs`: Application state management
- `menu.rs`: Native menu setup
- `models/mod.rs`: Data transfer objects for frontend IPC
- `services/mod.rs`: Business logic layer (Tauri-independent)
- `commands/mod.rs`: Tauri command handlers
- Run `cargo check` to verify

### 5.3 Verify services have no Tauri dependencies
- [ ] done
- Run `grep -r "use tauri" src-tauri/src/services/`
- Must return no matches
- Run `cargo check` to verify

### 5.4 Final verification
- [ ] done
- Run `cargo build --release`
- Run `bun run tauri dev` and test: open file, view emails, search, download attachment
- Verify all functionality works as before
