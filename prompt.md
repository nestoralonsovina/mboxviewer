# MBOX Viewer — Tailwind Migration Prompt

You are migrating an Angular 20 + Tauri 2 MBOX viewer app from custom CSS to Tailwind CSS.

## How to use this prompt

1. Read `spec.md` in the project root. It defines every task with checkboxes (`[ ]` = pending, `[x]` = done).
2. Find the **first task not marked as done**. That is your task.
3. Execute that task following the rules below.
4. When finished, mark it `[x]` in `spec.md`, commit and push your changes.
5. Stop. Do not proceed to the next task unless explicitly asked.

## Rules

### Tailwind conventions

- **Tailwind 4** — CSS-first config with `@theme` directive, no `tailwind.config.js`.
- **Utility-first** — prefer Tailwind classes over custom CSS.
- **Dark mode** — use `dark:` variant classes (auto-detects `prefers-color-scheme`).
- **Responsive** — use `max-md:`, `max-lg:` for mobile-down breakpoints.
- **No arbitrary values** — use Tailwind's scale where possible. Use `[value]` syntax only when necessary.
- **See** `docs/tailwind-v4-reference.md` for complete API reference.

### Migration pattern

When migrating a component's CSS to Tailwind:

1. **Read the existing CSS file** — understand all styles being used.
2. **Map CSS properties to Tailwind utilities**:
   - `display: flex` → `flex`
   - `align-items: center` → `items-center`
   - `padding: 0.75rem 1rem` → `px-4 py-3`
   - `color: var(--text-primary)` → `text-slate-900 dark:text-slate-50`
   - `background: var(--bg-secondary)` → `bg-slate-50 dark:bg-slate-800`
   - `border-radius: var(--radius-md)` → `rounded-lg`
   - `transition: all var(--transition)` → `transition-all duration-150`
3. **Apply classes directly in HTML** — add to element's `class` attribute.
4. **Handle :host styles** — use component's `host` property:
   ```typescript
   @Component({
     host: { class: 'block h-screen overflow-hidden' },
     ...
   })
   ```
5. **Delete the CSS file** when fully migrated.
6. **Remove styleUrl** from component decorator.
7. **Verify**: `bun run build` must succeed.

### Design token mapping

Current CSS variables → Tailwind classes:

| CSS Variable | Light Mode | Dark Mode |
|--------------|------------|-----------|
| `--bg-primary` | `bg-white` | `dark:bg-slate-900` |
| `--bg-secondary` | `bg-slate-50` | `dark:bg-slate-800` |
| `--bg-tertiary` | `bg-slate-100` | `dark:bg-slate-700` |
| `--text-primary` | `text-slate-900` | `dark:text-slate-50` |
| `--text-secondary` | `text-slate-600` | `dark:text-slate-400` |
| `--text-muted` | `text-slate-400` | `dark:text-slate-500` |
| `--border-color` | `border-slate-200` | `dark:border-slate-700` |
| `--accent-color` | `text-indigo-500` / `bg-indigo-500` | same |
| `--accent-hover` | `hover:bg-indigo-600` | same |
| `--danger-color` | `text-rose-500` | same |
| `--radius-sm` | `rounded` | — |
| `--radius-md` | `rounded-lg` | — |
| `--radius-lg` | `rounded-xl` | — |
| `--transition` | `transition-all duration-150` | — |

### Spacing scale

| CSS Value | Tailwind |
|-----------|----------|
| `0.25rem` | `1` |
| `0.375rem` | `1.5` |
| `0.5rem` | `2` |
| `0.625rem` | `2.5` |
| `0.75rem` | `3` |
| `0.875rem` | `3.5` |
| `1rem` | `4` |
| `1.25rem` | `5` |
| `1.5rem` | `6` |
| `2rem` | `8` |
| `2.5rem` | `10` |
| `3rem` | `12` |

### Typography scale

| CSS Value | Tailwind |
|-----------|----------|
| `0.6875rem` (11px) | `text-[11px]` |
| `0.75rem` (12px) | `text-xs` |
| `0.8125rem` (13px) | `text-[13px]` |
| `0.875rem` (14px) | `text-sm` |
| `1rem` (16px) | `text-base` |
| `1.25rem` (20px) | `text-xl` |
| `2rem` (32px) | `text-3xl` |

### Responsive breakpoints

| CSS Media Query | Tailwind |
|-----------------|----------|
| `@media (max-width: 900px)` | `max-lg:` (≤1024px) or custom |
| `@media (max-width: 700px)` | `max-md:` (≤768px) |

### What NOT to do

- Do not create a `tailwind.config.js` — use CSS-first config.
- Do not add custom CSS unless Tailwind cannot express it.
- Do not change component logic or TypeScript code (unless updating `host`).
- Do not modify Rust/Tauri backend code.
- Do not refactor beyond the scope of the current task.
- Do not use `@apply` — inline utilities directly.

## Verification

After every task:

1. `bun run build` must succeed with zero errors.
2. `bun run lint` must pass.
3. Manual smoke test: open an `.mbox` file, browse emails, search, filter by label, view email body, download an attachment. Everything must work as before.
4. Visual test: appearance should match or improve upon the original design.

## Context files

Read these before starting:

- `spec.md` — the full task list and migration spec
- `docs/tailwind-v4-reference.md` — Tailwind v4 API reference (theme, directives, patterns)
- `AGENTS.md` — project structure, Tauri commands
- `src/styles.css` — current global styles with CSS variables
- Any component's `.css` file before migrating it
