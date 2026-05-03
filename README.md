# MBOX Viewer

A desktop app for viewing Gmail Takeout exports and other MBOX files. Built with Tauri 2 and Angular.

![CI](https://github.com/nestoralonsovina/mboxviewer/actions/workflows/ci.yml/badge.svg)

## Features

- **Open MBOX files** — including large Gmail Takeout exports
- **Instant search** — debounced query with full syntax support (sender, date ranges, labels, attachments, size filters)
- **Gmail labels** — sidebar filtering with label counts from Gmail Takeout
- **Email viewer** — HTML body, raw headers, inline attachments
- **Attachment download** — save individual attachments to disk
- **Recent files** — remembers and auto-reopens recent MBOX files
- **Dark mode** — auto-detects system preference
- **Spanish & English** — i18n via @ngx-translate

## Installation

### Download Prebuilt App

Grab the latest `.dmg` from [Releases](https://github.com/nestoralonsovina/mboxviewer/releases).

### Build from Source

**Requirements:** Rust, Bun, and a macOS environment (Tauri 2 runs natively).

```bash
bun install
make dev        # development mode
make build      # production build
```

Or using the Makefile:

| Command | Description |
|---------|-------------|
| `make install` | Install dependencies |
| `make dev` | Run in development mode |
| `make build` | Build for production |
| `make test` | Run frontend + backend tests |
| `make lint` | Lint TypeScript + Rust |
| `make check` | Check Rust compilation |
| `make clean` | Remove build artifacts |

## Architecture

```
src/                          # Angular 20 frontend
├── app/
│   ├── core/
│   │   ├── models/           # Domain types (EmailEntry, MboxStats, ...)
│   │   ├── tauri/            # Tauri IPC service layer
│   │   ├── store/            # Settings persistence
│   │   ├── services/         # Window service
│   │   └── utils/            # Pure formatting functions
│   └── features/
│       ├── mail/             # Mail client (shell, list, detail, toolbar)
│       ├── welcome/          # Welcome screen + recent files
│       └── preferences/      # Settings page
│
src-tauri/                    # Tauri 2 / Rust backend
├── src/
│   ├── commands/             # Thin Tauri command wrappers
│   ├── services/             # Business logic (zero Tauri deps)
│   ├── models/               # IPC data transfer objects
│   ├── error.rs              # AppError enum with thiserror
│   ├── state.rs              # AppState management
│   └── menu.rs               # Native menu setup
└── capabilities/             # Tauri permissions
```

The backend wraps the [mboxshell](https://github.com/nestoralonsovina/mboxshell) library for MBOX parsing, indexing, and search.

## Search Syntax

```
from:user@example.com       Search by sender
to:recipient@example.com    Search by recipient
subject:invoice             Search in subject
body:important              Full-text search
has:attachment              Filter attachments
label:Inbox                 Filter by Gmail label
date:2024-01                Date filter
date:2024-01..2024-06       Date range
size:>1mb                   Size filter
-subject:spam               Exclude terms
"exact phrase"              Exact match
term1 OR term2              OR search
```

## Release

Tag a commit with `v*` (e.g. `v0.1.0`) and push — the [release workflow](.github/workflows/release.yml) builds and publishes a `.dmg` automatically.

## License

MIT
