# AGENTS.md

This file provides guidance for AI agents working on this codebase.

## Project Overview

MBOX Viewer is a desktop application for viewing Gmail Takeout exports and other MBOX files. It's built with:

- **Frontend**: Angular 20 with standalone components and signals
- **Styling**: Tailwind CSS v4 (utility-first, no custom CSS)
- **Backend**: Tauri 2 (Rust) wrapping the [mboxshell](https://github.com/nestoralonsovina/mboxshell) library
- **Package Manager**: Bun

## Architecture

```
src/                          # Angular frontend
├── app/
│   ├── app.component.*       # Main app component (welcome screen + mail client UI)
│   ├── services/
│   │   └── mbox.service.ts   # Service for Tauri IPC communication
│   └── app.routes.ts         # Router config (currently unused)
├── styles.css                # Global styles
└── main.ts                   # Bootstrap

src-tauri/                    # Tauri/Rust backend
├── src/
│   ├── lib.rs                # Tauri commands and app state
│   └── main.rs               # Entry point
├── Cargo.toml                # Rust dependencies
├── tauri.conf.json           # Tauri configuration
└── capabilities/             # Tauri permissions
```

## Key Commands

```bash
# Install dependencies
bun install

# Run in development mode
bun run tauri dev

# Build for production
bun run tauri build

# Check Rust code
cd src-tauri && cargo check

# Build Angular only
bun run build
```

## Tauri Commands (Backend API)

All commands are defined in `src-tauri/src/lib.rs`:

| Command | Description |
|---------|-------------|
| `open_mbox(path)` | Open an MBOX file and build/load index |
| `get_emails(offset, limit)` | Get paginated email list |
| `get_email_count()` | Get total email count |
| `get_email_body(index)` | Get full email content |
| `search_emails(query, limit)` | Search with mboxshell syntax |
| `get_emails_by_label(label)` | Filter by Gmail label |
| `get_attachment(email_index, attachment_index)` | Download attachment data |
| `get_labels()` | Get all labels with counts |
| `close_mbox()` | Close current file |

## Frontend State Management

The app uses Angular signals for reactive state in `MboxService`:

- `isLoading` / `isSearching` - Loading states
- `stats` - MBOX file statistics
- `emails` - Current email list
- `selectedEmail` / `selectedEmailBody` - Selected email data
- `searchQuery` / `selectedLabel` - Current filters
- `error` - Error messages

Search is debounced (150ms) using RxJS for instant feedback.

## Search Syntax

The app supports mboxshell's query syntax:

```
from:user@example.com       # Search by sender
to:recipient@example.com    # Search by recipient  
subject:invoice             # Search in subject
body:important              # Full-text search (slower)
has:attachment              # Filter attachments
label:Inbox                 # Filter by Gmail label
date:2024-01                # Date filter
date:2024-01-01..2024-06-30 # Date range
size:>1mb                   # Size filter
-subject:spam               # Exclude terms
"exact phrase"              # Exact match
term1 OR term2              # OR search
```

## Styling Guidelines

**Use Tailwind CSS only.** No custom CSS files.

- All styling via Tailwind utility classes in templates
- Theme configuration in `src/styles.css` using `@theme` directive
- Dark mode via `dark:` variant (auto-detects `prefers-color-scheme`)
- Responsive via `max-md:`, `max-lg:` breakpoints
- Component host styles via Angular's `host` property, not `:host` CSS
- See `docs/tailwind-v4-reference.md` for API reference

## Development Notes

1. **Async Commands**: Search runs in `tokio::spawn_blocking` to avoid blocking the main thread
2. **Result Limits**: Search returns max 500 results by default to avoid serialization overhead
3. **Mutex Usage**: App state uses `Mutex` for thread-safe access; be careful with lock ordering
4. **mboxshell Integration**: The library is included as a git dependency, not vendored

## Testing

Currently no automated tests. Manual testing:

1. Open a `.mbox` file (Gmail Takeout export works well)
2. Verify email list loads with correct sender/subject/date
3. Click an email to view body and attachments
4. Test search with various query syntaxes
5. Test label filtering in sidebar
6. Download an attachment

## Common Issues

- **Hang on search**: Usually mutex contention or large result serialization. Search is now async.
- **Index not loading**: Check if `.mboxshell.idx` file exists next to the MBOX file
- **Permissions errors**: Ensure Tauri capabilities include `dialog` and `fs` permissions
