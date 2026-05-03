# Contributing

Thanks for considering a contribution. This project is intentionally straightforward — an MBOX viewer with a Tauri + Angular stack.

## Development Setup

```bash
bun install          # Install frontend dependencies
make dev             # Launch in development mode
```

### Requirements

- Rust (stable) + Cargo
- [Bun](https://bun.sh)
- macOS (Tauri 2 native runtime)

## Project Conventions

### Backend (Rust)

- **Services have zero Tauri dependencies** — the `services/` module never imports `tauri`. Business logic is pure Rust, testable without a Tauri runtime.
- **Commands are thin wrappers** — `#[tauri::command]` functions extract input, delegate to the service, and return `Result<T, AppError>`.
- **Error types** — use `thiserror` for domain errors. No `Result<T, String>`.
- **Accept `&str`/`&Path`** in function parameters, return owned types.

### Frontend (Angular)

- **Standalone components** — no NgModules.
- **Signals** for reactive state management.
- **Tailwind CSS v4** only — no custom `.css` files. All styling via utility classes in templates.
- **Domain models in `core/models/`** — interfaces matching the IPC DTOs from Rust.

## Code Style

- Run `make lint` before committing
- `cargo check` must pass with zero errors
- No `.unwrap()` in production paths — use `?` or `.expect("reason")`

## Architecture Decisions

The backend follows a layered architecture:

```
commands/  →  services/  →  mboxshell (external lib)
 (Tauri)     (pure Rust)    (MBOX parsing)
```

The service layer has zero framework dependencies, making it testable without a Tauri runtime. Commands are thin adapters that extract input from the IPC boundary and delegate to services.

## Adding Features

1. **Backend changes**: Add service methods in `services/mbox_service.rs`, then expose via a thin command in `commands/mbox.rs`.
2. **Frontend changes**: Add models in `core/models/`, extend the Tauri IPC service in `core/tauri/`, then build UI in `features/`.
3. **Search syntax**: Extensions to search syntax go through mboxshell's query parser.

## Questions?

Open an issue.
