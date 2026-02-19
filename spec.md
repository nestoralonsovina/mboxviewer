# MBOX Viewer — Frontend Refactoring Spec

## Context

The frontend is an Angular 20 + Tauri 2 desktop app for reading Gmail Takeout `.mbox` files. The current implementation works but has a single God Component (343-line template, 810-line CSS), a monolithic service mixing 5 concerns, type safety violations, no tests, and no linting. This spec defines an incremental refactoring plan that keeps the app working after every step.

## Conventions

- **Angular 20** — standalone components, signals, `@if`/`@for` control flow, `@let` template variables, `inject()`.
- **TypeScript** — strictest possible settings. Zero `any`, zero `as`, zero `!` in templates.
- **Testing** — Vitest for unit/component tests. Every new file gets a spec file.
- **Components** — one responsibility, inputs via `input()`, outputs via `output()`. No barrel files.
- **Services** — single responsibility. State service is separate from API service.
- **CSS** — component-scoped. Shared design tokens in `styles.css` as `:root` variables.

---

## Phase 1: Foundation

No UI changes. Fix type safety, add tooling, remove dead code.

### 1.1 Add `noUncheckedIndexedAccess` to tsconfig
- [x] done
- Add `"noUncheckedIndexedAccess": true` to `compilerOptions` in `tsconfig.json`.
- Fix any resulting compiler errors (array/object index access now returns `T | undefined`).

### 1.2 Fix `as string` in `MboxService.openFile()`
- [x] done
- File: `src/app/services/mbox.service.ts`, line 187.
- `open({ multiple: false })` returns `string | string[] | null`. The `if (selected)` guard narrows away `null` but not `string[]`.
- Replace `selected as string` with a proper type guard:
  ```typescript
  if (typeof selected === 'string') {
    await this.loadMbox(selected);
  }
  ```

### 1.3 Fix `$any()` in search input
- [x] done
- File: `src/app/app.component.html`, line 130.
- Replace `$any($event.target).value` with a template reference variable:
  ```html
  <input #searchInput type="text" ... (input)="onSearchInput(searchInput.value)">
  ```
- Update the `[value]` binding to also use the ref or a signal.

### 1.4 Fix `!` non-null assertions in template
- [x] done
- File: `src/app/app.component.html`, lines 142, 240, 257, 259, 272, 278.
- Use `@let` to capture values at the top of each block:
  ```html
  @if (mbox.selectedEmail(); as email) {
    <!-- or -->
  @let email = mbox.selectedEmail();
  @if (email) {
    <!-- use email.to, email.date, etc. — no ! needed -->
  }
  ```
- Same pattern for `mbox.selectedEmailBody()` and `mbox.searchResultsCount()`.

### 1.5 Add ESLint with strict TypeScript rules
- [x] done
- Install `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `angular-eslint`.
- Create `eslint.config.mjs` (flat config) extending `@typescript-eslint/strict-type-checked`.
- Key rules (all `error`):
  - `@typescript-eslint/no-explicit-any`
  - `@typescript-eslint/no-unsafe-argument`
  - `@typescript-eslint/no-unsafe-assignment`
  - `@typescript-eslint/no-unsafe-call`
  - `@typescript-eslint/no-unsafe-member-access`
  - `@typescript-eslint/no-unsafe-return`
  - `@typescript-eslint/consistent-type-assertions` with `assertionStyle: 'never'`
  - `@typescript-eslint/no-non-null-assertion`
- Add `"lint": "eslint src/"` script to `package.json`.
- Fix any violations.

### 1.6 Add Vitest
- [x] done
- Install `vitest`, `@analogjs/vitest-angular` (Angular component testing support).
- Create `vitest.config.ts` with Angular plugin.
- Add `"test": "vitest"` script to `package.json`.
- Write a first smoke test for one of the pure utility functions (added in Phase 2).

### 1.7 Remove dead code and fix metadata
- [x] done
- Remove `@tauri-apps/plugin-opener` from `package.json` (unused in frontend).
- Remove `src/assets/tauri.svg` and `src/assets/angular.svg` (scaffold remnants).
- Change `<title>` in `src/index.html` from "Tauri + Angular" to "MBOX Viewer".
- Change `inlineStyleLanguage` in `angular.json` from `"scss"` to `"css"` (project uses plain CSS).
- Remove `@angular/router` provider from `app.config.ts` and delete `app.routes.ts` (empty routes; re-add later if needed).
- Remove `@angular/router` from `package.json` if no other code uses it.

---

## Phase 2: Extract Core Layer

Split the monolithic service. No UI template changes.

### 2.1 Extract `core/utils/format.ts`
- [x] done
- Create `src/app/core/utils/format.ts` with pure functions:
  - `formatDate(dateStr: string): string`
  - `formatFileSize(bytes: number): string`
  - `formatSender(email: { from_name: string; from_address: string }): string`
  - `getFileName(path: string | null): string`
  - `formatRelativeDate(dateStr: string): string`
- Move implementations from `MboxService` and `AppComponent`.
- Write unit tests in `format.spec.ts`.
- Update `MboxService` and `AppComponent` to import from `core/utils/format`.

### 2.2 Extract `core/tauri/mbox-api.service.ts`
- [x] done
- Create `MboxApiService` — an injectable service that wraps all `invoke()` calls.
- Methods (all return `Promise`):
  - `openMbox(path: string): Promise<MboxStats>`
  - `getEmails(offset: number, limit: number): Promise<EmailEntry[]>`
  - `getEmailCount(): Promise<number>`
  - `getEmailBody(index: number): Promise<EmailBody>`
  - `searchEmails(query: string, limit: number): Promise<SearchResults>`
  - `getEmailsByLabel(label: string): Promise<EmailEntry[]>`
  - `getAttachment(emailIndex: number, attachmentIndex: number): Promise<number[]>`
  - `getLabels(): Promise<LabelCount[]>`
  - `closeMbox(): Promise<void>`
- Move all interfaces (`EmailEntry`, `EmailBody`, `MboxStats`, etc.) into `src/app/core/models/mbox.models.ts`.
- No state. No side effects. Easy to mock in tests.

### 2.3 Extract `core/store/settings-store.service.ts`
- [x] done
- Create `SettingsStoreService` — manages `@tauri-apps/plugin-store` interactions.
- Methods:
  - `initialize(): Promise<void>` — loads the store instance.
  - `getRecentFiles(): Promise<RecentFile[]>`
  - `saveRecentFiles(files: RecentFile[]): Promise<void>`
- Move recent file persistence logic from `MboxService`.

### 2.4 Refactor `MboxService` into `MboxStateService`
- [x] done
- Rename file to `src/app/state/mbox-state.service.ts`.
- Inject `MboxApiService` and `SettingsStoreService`.
- Remove all `invoke()` calls — delegate to `MboxApiService`.
- Remove store logic — delegate to `SettingsStoreService`.
- Remove formatting methods — import from `core/utils/format`.
- Keep only: signals, computed properties, orchestration logic.

### 2.5 Replace constructor side-effect with explicit initialization
- [x] done
- Remove the `this.initialize()` call from the constructor.
- Use `APP_INITIALIZER` in `app.config.ts` to call `mboxState.initialize()` at startup.
- This makes the initialization controllable and testable.

### 2.6 Granular loading states
- [x] done
- Replace the single `_isLoading` signal with distinct signals:
  ```typescript
  readonly loadingFile = signal(false);
  readonly loadingEmails = signal(false);
  readonly loadingEmailBody = signal(false);
  ```
- Update the template to use the appropriate signal for each loading indicator.
- This prevents concurrent operations from clobbering each other's loading state.

---

## Phase 3: Decompose the God Component

Extract one component at a time. Each extraction is a commit. The app works after every step.

### 3.1 Extract `shared/components/icon/`
- [x] done
- Create `IconComponent` with an `input()` for the icon name.
- Define an icon registry (string map of SVG path data for: `mail`, `close`, `folder`, `search`, `attachment`, `download`, `file`, `tag`, `activity`, `arrow-left`, `alert-circle`).
- Replace all inline `<svg>` blocks in the template with `<app-icon name="mail" [size]="20">`.
- This alone cuts ~100 lines from the template.

### 3.2 Extract `shared/components/spinner/`
- [x] done
- Create `SpinnerComponent` — the reusable loading spinner.
- Input: `size` (optional, default `16`).
- Replace all `<span class="spinner">` instances.

### 3.3 Extract `shared/components/error-toast/`
- [x] done
- Create `ErrorToastComponent`.
- Inputs: `message: string | null` (via signal input).
- Output: `dismissed`.
- Move the error toast template block (lines 332-342) and its CSS.

### 3.4 Extract `features/welcome/`
- [x] done
- Create `WelcomeComponent` — the welcome screen (template lines 1-51).
- Create `RecentFilesListComponent` — the recent files list within the welcome screen.
- Inputs: `recentFiles`, `isLoading`.
- Outputs: `openFile`, `openRecent`, `removeRecent`.
- Move CSS: `.welcome-*`, `.recent-*`, `.loading-indicator`.

### 3.5 Extract `features/mail/sidebar/`
- [ ] done
- Create `SidebarComponent` — container.
- Create `SidebarStatsComponent` — shows email count and attachment count.
- Create `LabelNavComponent` — label navigation list.
- Inputs: `stats`, `labels`, `selectedLabel`, `searchQuery`, `currentPath`.
- Outputs: `openFile`, `closeFile`, `labelClick`.
- Move CSS: `.sidebar*`, `.nav-*`, `.stat*`, `.file-name`.

### 3.6 Extract `features/mail/toolbar/search-toolbar.component.ts`
- [ ] done
- Create `SearchToolbarComponent`.
- Inputs: `isSearching`, `searchResultsCount`, `emailCount`.
- Outputs: `search`, `clearSearch`.
- Manage its own `searchInput` signal internally.
- Use `#searchInput` template ref (no `$any()`).
- Move CSS: `.toolbar`, `.search-*`.

### 3.7 Extract `features/mail/email-list/`
- [ ] done
- Create `EmailListComponent` — the scrollable list container.
- Create `EmailItemComponent` — a single email row.
- Inputs: `emails`, `selectedEmail`, `isLoading`, `searchQuery`, `selectedLabel`.
- Outputs: `emailClick`.
- Move CSS: `.email-list`, `.email-item*`, `.email-sender`, `.email-subject`, `.email-date`, `.email-labels`, `.label-tag`, `.list-header`.

### 3.8 Extract `features/mail/email-detail/`
- [ ] done
- Create `EmailDetailComponent` — container for the detail view.
- Create `EmailMetaComponent` — from/to/date/labels metadata block.
- Create `EmailBodyComponent` — iframe/text rendering.
- Create `AttachmentsListComponent` — attachment list with download.
- Inputs: `email`, `emailBody`, `isLoading`.
- Outputs: `close`, `downloadAttachment`.
- Move CSS: `.email-detail`, `.detail-*`, `.meta-*`, `.attachments-*`, `.email-body`, `.email-iframe`, `.email-text`.

### 3.9 Compose `MailShellComponent`
- [ ] done
- Create `features/mail/mail-shell.component.ts` — the layout that composes sidebar + main content.
- `AppComponent` becomes a thin shell: just `@if (mbox.isFileOpen()) { <app-mail-shell /> } @else { <app-welcome /> }` + `<app-error-toast>`.

### 3.10 Promote CSS variables to `:root`
- [ ] done
- Move CSS custom properties from `:host` of the old `AppComponent` to `:root` in `src/styles.css`.
- Include the dark mode overrides.
- All child components now inherit the theme tokens without needing to redeclare them.

---

## Phase 4: Polish

### 4.1 Add pure pipes
- [ ] done
- Create `FileNamePipe` — wraps `getFileName()`.
- Create `RelativeDatePipe` — wraps `formatRelativeDate()`. Pure pipe = memoized.
- Use them in templates where method calls currently run on every change detection.

### 4.2 Tighten security
- [ ] done
- Change iframe `sandbox="allow-same-origin"` to `sandbox=""` (fully sandboxed).
- Add a restrictive CSP to `src-tauri/tauri.conf.json`:
  ```json
  "csp": "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self'"
  ```
- Verify email rendering still works with the tightened sandbox.

### 4.3 Email list pagination
- [ ] done
- Implement "load more" or infinite scroll in `EmailListComponent`.
- Track `offset` in `MboxStateService`. `loadMoreEmails()` appends to existing list.
- Use `@angular/cdk/scrolling` virtual scroll or a manual intersection observer.

### 4.4 Keyboard navigation
- [ ] done
- Arrow up/down to navigate email list.
- Enter to open selected email.
- Escape to close email detail.
- Implement via `@HostListener` or `cdkTrapFocus` in appropriate components.

### 4.5 Narrow Tauri permissions
- [ ] done
- In `src-tauri/capabilities/default.json`, remove `opener:default` (unused).
- Scope `fs:allow-read` and `fs:allow-write` to specific paths if possible.
