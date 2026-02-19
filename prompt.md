# MBOX Viewer — Development Prompt

You are continuing the frontend refactoring of an Angular 20 + Tauri 2 MBOX viewer app.

## How to use this prompt

1. Read `spec.md` in the project root. It defines every task with checkboxes (`[ ]` = pending, `[x]` = done).
2. Find the **first task not marked as done**. That is your task.
3. Execute that task following the rules below.
4. When finished, mark it `[x]` in `spec.md`, commit and push your changes
5. Stop. Do not proceed to the next task unless explicitly asked.

## Rules

### TypeScript strictness (non-negotiable)

- Zero `any`. Zero `as` type assertions. Zero `@ts-ignore`. Zero `!` non-null assertions.
- If a type is `unknown`, narrow it with a type guard. If an index access returns `T | undefined`, handle the `undefined`.
- If the compiler complains, the compiler is right. Fix the type, not the symptom.

### Angular conventions

- Standalone components only. No NgModules.
- Use `input()` / `output()` signal-based APIs for component I/O.
- Use `inject()` — never constructor injection.
- Use `@let` for template local variables to avoid repeated signal calls and `!` assertions.
- Use Angular 20 control flow: `@if`, `@for`, `@let`. No `*ngIf`, `*ngFor`.

### Component extraction pattern

When extracting a component from the God Component (`app.component.*`):

1. Create the new component file(s) with their template and styles.
2. Define typed `input()` and `output()` signals.
3. Cut the relevant template block from `app.component.html` into the new component.
4. Cut the relevant CSS from `app.component.css` into the new component.
5. Wire the new component into the parent with proper input bindings and output handlers.
6. Verify the app still compiles: `bun run build`.
7. If the task says to write tests, write them. If adding a pure function or pipe, always write tests.

### Service extraction pattern

When extracting a service:

1. Create the new service file.
2. Move the relevant methods and their dependencies.
3. Update the consuming service/component to inject the new service.
4. Ensure no circular dependencies.
5. Verify: `bun run build`.

### File placement

```
src/app/core/         — framework-agnostic: API clients, models, pure utils
src/app/state/        — signal-based state management
src/app/shared/       — reusable UI components (icon, spinner, toast), pipes
src/app/features/     — feature modules (welcome, mail and its children)
```

### What NOT to do

- Do not create barrel files (`index.ts`). Import directly from the file.
- Do not add `@angular/router` unless the spec task explicitly says to.
- Do not change Rust/Tauri backend code unless the spec task explicitly says to.
- Do not refactor beyond the scope of the current task.
- Do not skip writing tests when the spec says to write them.

## Verification

After every task:

1. `bun run build` must succeed with zero errors.
2. `bun run lint` must pass (once ESLint is added in 1.5).
3. `bun run test` must pass (once Vitest is added in 1.6).
4. Manual smoke test: open an `.mbox` file, browse emails, search, filter by label, view email body, download an attachment. Everything must work as before.

## Context files

Read these before starting:

- `spec.md` — the full task list and architecture spec
- `AGENTS.md` — project structure, Tauri commands, search syntax
- `src/app/services/mbox.service.ts` — current monolithic service
- `src/app/app.component.ts` — current God Component (TS)
- `src/app/app.component.html` — current God Component (template)
- `src/app/app.component.css` — current God Component (styles)
- `tsconfig.json` — current TypeScript configuration
- `package.json` — current dependencies
