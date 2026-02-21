# MBOX Viewer — Tailwind CSS Migration Spec

## Context

The frontend is an Angular 20 + Tauri 2 desktop app for reading Gmail Takeout `.mbox` files. The previous refactoring extracted components from a God Component and established proper architecture. Now we migrate from custom CSS to Tailwind CSS for scalability, maintainability, and a cohesive design system.

## Design Direction

**Aesthetic**: Modern, focused mail client. Dark mode first with crisp light mode. Desktop-native feel—clean without being sterile.

**Typography**: System fonts (SF Pro/Segoe UI) for native feel. Clear 3-tier hierarchy.

**Color Palette**:
- **Backgrounds**: Slate grays (dark: `slate-900/slate-800/slate-700`) / warm whites (light: `white/slate-50/slate-100`)
- **Accent**: Indigo (`indigo-500`) — vibrant but professional
- **Text**: High contrast hierarchy (`slate-50/slate-300/slate-500` dark, `slate-900/slate-600/slate-400` light)
- **States**: Success green (`emerald-500`), danger red (`rose-500`)

**Distinctive Elements**:
- Subtle depth with refined shadows
- Consistent 8px/12px border radii
- Smooth 150ms transitions
- Focus rings for accessibility

## Conventions

- **Tailwind 4** — CSS-first configuration using `@theme` directive
- **No `tailwind.config.js`** — all customization in `src/styles.css`
- **Utility-first** — prefer Tailwind classes over custom CSS
- **Responsive** — mobile breakpoints via Tailwind's `max-md:`, `max-lg:` prefixes (mobile-first down)
- **Dark mode** — use `prefers-color-scheme` with Tailwind's `dark:` variant
- **Component styles** — delete CSS files once fully migrated
- **Reference** — see `docs/tailwind-v4-reference.md` for detailed API

---

## Phase 1: Foundation Setup

### 1.1 Install Tailwind CSS dependencies
- [x] done
- Run `bun add tailwindcss @tailwindcss/postcss postcss`
- Create `.postcssrc.json` in project root:
  ```json
  {
    "plugins": {
      "@tailwindcss/postcss": {}
    }
  }
  ```

### 1.2 Configure Tailwind theme in styles.css
- [x] done
- Replace `src/styles.css` with Tailwind import and custom theme
- Use `@import 'tailwindcss';` at the top
- Define design tokens using `@theme` block:
  - Custom colors matching the design direction
  - Custom shadows with subtle tints
  - Transition timing (150ms)
- Preserve box-sizing reset and scrollbar styling
- Include base styles for html/body

### 1.3 Verify Tailwind works
- [x] done
- Run `bun run tauri dev`
- Temporarily add `class="bg-red-500"` to a visible element
- Confirm red background appears
- Remove test class
- Commit foundation setup

---

## Phase 2: Core Layout Components

### 2.1 Migrate app.component styles
- [x] done
- File: `src/app/app.component.ts`
- Add `host` property with Tailwind classes: `block h-screen overflow-hidden font-sans text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-900`
- Delete `src/app/app.component.css`
- Remove `styleUrl` from component decorator

### 2.2 Migrate mail-shell.component
- [x] done
- File: `src/app/features/mail/mail-shell.component.html`
- Convert layout classes:
  - `.app-layout` → `flex h-screen`
  - `.main-content` → `flex-1 flex flex-col min-w-0`
  - `.content-area` → `flex-1 flex overflow-hidden`
  - `.email-list` / `.email-list.has-selection` → conditional classes
  - `.loading-state`, `.empty-state` → utility classes
- Handle responsive: `max-md:flex-col`, `max-md:hidden` for selection
- Delete `mail-shell.component.css`

### 2.3 Migrate sidebar.component
- [x] done
- File: `src/app/features/mail/sidebar/sidebar.component.html`
- Convert:
  - `.sidebar` → `flex flex-col w-65 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700`
  - `.sidebar-header` → `flex items-center gap-2 p-3 border-b ...`
  - `.file-name` → `flex-1 text-sm font-medium truncate ...`
  - `.btn-icon` → `flex items-center justify-center w-8 h-8 rounded ...`
- Responsive: `max-lg:w-55 max-md:w-full max-md:max-h-[40vh]`
- Delete `sidebar.component.css`

---

## Phase 3: Toolbar & Search

### 3.1 Migrate search-toolbar.component
- [x] done
- File: `src/app/features/mail/toolbar/search-toolbar.component.html`
- Convert:
  - `.toolbar` → `flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b ...`
  - `.search-box` → `flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg ...`
  - Focus state: `focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500`
  - `.search-results-count` → `text-sm text-slate-500 whitespace-nowrap`
  - `.btn-clear` → `flex items-center justify-center p-1 text-slate-400 hover:text-slate-600 ...`
- Delete `search-toolbar.component.css`

---

## Phase 4: Email List Components

### 4.1 Migrate email-list.component
- [x] done
- File: `src/app/features/mail/email-list/email-list.component.ts`
- Add host class: `block overflow-y-auto bg-white dark:bg-slate-900`
- Convert:
  - `.list-header` → `px-4 py-3 text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800 border-b ...`
  - `.loading-state`, `.empty-state` → `flex flex-col items-center justify-center gap-4 p-12 text-slate-400`
- Delete `email-list.component.css`

### 4.2 Migrate email-item.component
- [x] done
- File: `src/app/features/mail/email-list/email-item.component.html`
- Convert:
  - `.email-item` → `flex flex-col gap-1 px-4 py-3.5 border-b border-slate-200 dark:border-slate-700 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800`
  - `.email-item.selected` → `bg-indigo-50 dark:bg-indigo-950 border-l-3 border-l-indigo-500 pl-[calc(1rem-3px)]`
  - `.email-sender` → `text-sm font-medium text-slate-900 dark:text-slate-50 truncate`
  - `.email-subject` → `flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-400 truncate`
  - `.email-date` → `text-xs text-slate-400`
  - `.label-tag` → `inline-block px-2 py-0.5 text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 rounded-full`
- Delete `email-item.component.css`

---

## Phase 5: Email Detail Components

### 5.1 Migrate email-detail.component
- [ ] done
- File: `src/app/features/mail/email-detail/email-detail.component.html`
- Convert:
  - `.email-detail` → `flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900`
  - `.detail-header` → `flex items-center px-4 py-3 border-b ...`
  - `.btn-back` → `flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 bg-transparent border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800`
  - `.detail-content` → `flex-1 overflow-y-auto p-6`
  - `.detail-subject` → `text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4`
- Mobile fullscreen: `max-md:fixed max-md:inset-0 max-md:z-50`
- Delete `email-detail.component.css`

### 5.2 Migrate email-meta.component
- [ ] done
- File: `src/app/features/mail/email-detail/email-meta.component.html`
- Convert:
  - `.detail-meta` → `flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-4`
  - `.meta-row` → `flex gap-3 text-sm`
  - `.meta-label` → `shrink-0 w-15 text-slate-500`
  - `.meta-value` → `text-slate-900 dark:text-slate-50 break-words`
  - `.meta-value.labels` → `flex flex-wrap gap-1.5`
  - `.label-tag` → same as email-item
- Delete `email-meta.component.css`

### 5.3 Migrate email-body.component
- [ ] done
- File: `src/app/features/mail/email-detail/email-body.component.html`
- Convert:
  - `.email-body` → `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden`
  - `.email-iframe` → `w-full min-h-[400px] border-none bg-white dark:bg-slate-900`
  - `.email-text` → `m-0 p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap break-words`
  - `.empty-body` → `p-8 text-center text-slate-400`
  - `.loading-state` → same as email-list
- Delete `email-body.component.css`

### 5.4 Migrate attachments-list.component
- [ ] done
- File: `src/app/features/mail/email-detail/attachments-list.component.html`
- Convert:
  - `.attachments-section` → `mb-4`
  - `h3` → `flex items-center gap-2 text-sm font-medium text-slate-500 mb-3`
  - `.attachments-list` → `flex flex-wrap gap-2`
  - `.attachment-item` → `flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-indigo-500`
  - `.attachment-info` → `flex flex-col min-w-0`
  - `.attachment-name` → `text-[13px] font-medium text-slate-900 dark:text-slate-50 truncate`
  - `.attachment-size` → `text-xs text-slate-400`
  - `.download-icon` → `text-indigo-500`
- Delete `attachments-list.component.css`

---

## Phase 6: Welcome Screen Components

### 6.1 Migrate welcome.component
- [ ] done
- File: `src/app/features/welcome/welcome.component.html`
- Convert:
  - `.welcome-screen` → `flex items-center justify-center h-screen bg-gradient-to-br from-slate-100 to-white dark:from-slate-900 dark:to-slate-800`
  - `.welcome-content` → `text-center p-12`
  - `.welcome-icon` → `text-indigo-500 mb-6`
  - `h1` → `text-3xl font-semibold text-slate-900 dark:text-slate-50 mb-2`
  - `p` → `text-slate-500 mb-8`
  - `.loading-indicator` → `flex items-center gap-3 text-slate-500`
  - `.btn-primary` → `inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors`
- Delete `welcome.component.css`

### 6.2 Migrate recent-files-list.component
- [ ] done
- File: `src/app/features/welcome/recent-files-list.component.html`
- Convert:
  - `.recent-files` → `mt-10 text-left w-full max-w-[400px]`
  - `h3` → `text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3`
  - `.recent-files-list` → `list-none m-0 p-0`
  - `.recent-file-item` → `group flex items-center rounded transition-colors hover:bg-slate-100 dark:hover:bg-slate-800`
  - `.recent-file-btn` → `flex-1 flex items-center gap-3 px-3 py-2.5 bg-transparent border-none cursor-pointer text-left text-slate-900 dark:text-slate-50 text-sm`
  - `.recent-file-btn svg` → `text-slate-400 shrink-0`
  - `.recent-file-name` → `flex-1 truncate`
  - `.recent-file-date` → `text-xs text-slate-400 shrink-0`
  - `.recent-file-remove` → `flex items-center justify-center w-7 h-7 p-0 bg-transparent border-none rounded text-slate-400 cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-rose-500 transition-all`
- Delete `recent-files-list.component.css`

---

## Phase 7: Finalization

### 7.1 Clean up empty CSS files
- [ ] done
- Remove all CSS files that are now empty or only contain comments
- Verify all components have `styleUrl` removed or pointing to valid files
- Run `bun run build` — must succeed with zero errors
- Run `bun run lint` — must pass

### 7.2 Full application test
- [ ] done
- Run `bun run tauri dev`
- Test welcome screen: open file button, recent files list
- Test mail view: sidebar, email list, search, label filtering
- Test email detail: metadata, body (HTML and plain text), attachments
- Test responsive: resize window to trigger breakpoints
- Test dark mode: toggle system preference
- Verify all interactions work as before
- Commit final changes
