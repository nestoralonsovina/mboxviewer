# Tailwind CSS v4 Reference

Quick reference for Tailwind CSS v4 features used in this project.

## Installation (Angular)

```bash
bun add tailwindcss @tailwindcss/postcss postcss
```

Create `.postcssrc.json`:
```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

Import in `src/styles.css`:
```css
@import "tailwindcss";
```

## Theme Configuration

Tailwind v4 uses **CSS-first configuration** via `@theme` directive. No `tailwind.config.js` needed.

### Basic Theme

```css
@import "tailwindcss";

@theme {
  /* Custom colors */
  --color-brand: oklch(0.6 0.2 250);
  --color-surface: #1a1a1a;
  
  /* Custom fonts */
  --font-display: "Satoshi", sans-serif;
  
  /* Custom spacing (multiplier) */
  --spacing: 0.25rem;
  
  /* Custom breakpoints */
  --breakpoint-3xl: 120rem;
  
  /* Custom radius */
  --radius-xl: 0.75rem;
  
  /* Custom shadows */
  --shadow-soft: 0 4px 12px rgb(0 0 0 / 0.08);
  
  /* Custom animations */
  --animate-fade-in: fade-in 0.3s ease-out;
  
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}
```

### Theme Variable Namespaces

| Namespace | Creates | Example |
|-----------|---------|---------|
| `--color-*` | Color utilities | `--color-mint-500` → `bg-mint-500`, `text-mint-500` |
| `--font-*` | Font family utilities | `--font-display` → `font-display` |
| `--text-*` | Font size utilities | `--text-xl` → `text-xl` |
| `--font-weight-*` | Font weight utilities | `--font-weight-bold` → `font-bold` |
| `--tracking-*` | Letter spacing | `--tracking-wide` → `tracking-wide` |
| `--leading-*` | Line height | `--leading-tight` → `leading-tight` |
| `--breakpoint-*` | Responsive variants | `--breakpoint-3xl` → `3xl:*` |
| `--container-*` | Container/max-width | `--container-md` → `max-w-md` |
| `--spacing-*` | Spacing scale | Used with `--spacing` multiplier |
| `--radius-*` | Border radius | `--radius-lg` → `rounded-lg` |
| `--shadow-*` | Box shadows | `--shadow-md` → `shadow-md` |
| `--blur-*` | Blur filters | `--blur-md` → `blur-md` |
| `--ease-*` | Timing functions | `--ease-out` → `ease-out` |
| `--animate-*` | Animations | `--animate-spin` → `animate-spin` |

### Overriding Default Theme

Reset a namespace then define custom values:

```css
@theme {
  /* Remove all default colors */
  --color-*: initial;
  
  /* Define only what you need */
  --color-white: #fff;
  --color-black: #000;
  --color-brand: oklch(0.6 0.2 250);
}
```

### Using `initial` for Full Reset

```css
@theme {
  --*: initial;  /* Remove ALL defaults */
  
  /* Define everything from scratch */
  --spacing: 4px;
  --color-primary: #4F46E5;
}
```

## Dark Mode

By default, uses `prefers-color-scheme` media query:

```html
<div class="bg-white dark:bg-slate-900">
  <!-- Auto-switches based on OS preference -->
</div>
```

### Manual Toggle (Optional)

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

Then use a `dark` class on `<html>`:

```html
<html class="dark">
  <body class="bg-white dark:bg-black">
```

## Directives Reference

### @import
```css
@import "tailwindcss";
@import "./custom.css";
```

### @theme
Define design tokens:
```css
@theme {
  --color-brand: #4F46E5;
}
```

### @utility
Create custom utilities:
```css
@utility content-auto {
  content-visibility: auto;
}
```

### @variant
Use variants in custom CSS:
```css
.my-element {
  background: white;
  @variant dark {
    background: black;
  }
}
```

### @custom-variant
Create custom variants:
```css
@custom-variant theme-dark (&:where([data-theme="dark"] *));
```

### @apply
Use utilities in custom CSS:
```css
.btn {
  @apply px-4 py-2 rounded-lg font-medium;
}
```

### @reference
Import for reference without emitting CSS (for component styles):
```css
@reference "../../app.css";
/* or */
@reference "tailwindcss";
```

## Functions

### --alpha()
Adjust color opacity:
```css
.element {
  color: --alpha(var(--color-blue-500) / 50%);
}
```

### --spacing()
Generate spacing from theme:
```css
.element {
  margin: --spacing(4);  /* 1rem if --spacing: 0.25rem */
}
```

## Default Spacing Scale

The default `--spacing: 0.25rem` creates:

| Class | Value |
|-------|-------|
| `p-0` | 0 |
| `p-1` | 0.25rem (4px) |
| `p-2` | 0.5rem (8px) |
| `p-3` | 0.75rem (12px) |
| `p-4` | 1rem (16px) |
| `p-5` | 1.25rem (20px) |
| `p-6` | 1.5rem (24px) |
| `p-8` | 2rem (32px) |
| `p-10` | 2.5rem (40px) |
| `p-12` | 3rem (48px) |
| `p-16` | 4rem (64px) |

## Default Breakpoints

| Variant | Min-width |
|---------|-----------|
| `sm:` | 40rem (640px) |
| `md:` | 48rem (768px) |
| `lg:` | 64rem (1024px) |
| `xl:` | 80rem (1280px) |
| `2xl:` | 96rem (1536px) |

For max-width (mobile-first down):
- `max-sm:` → `@media (max-width: 39.9375rem)`
- `max-md:` → `@media (max-width: 47.9375rem)`
- etc.

## Default Border Radius

| Class | Value |
|-------|-------|
| `rounded-xs` | 0.125rem (2px) |
| `rounded-sm` | 0.25rem (4px) |
| `rounded` | 0.25rem (4px) |
| `rounded-md` | 0.375rem (6px) |
| `rounded-lg` | 0.5rem (8px) |
| `rounded-xl` | 0.75rem (12px) |
| `rounded-2xl` | 1rem (16px) |
| `rounded-full` | 9999px |

## Default Shadows

| Class | Description |
|-------|-------------|
| `shadow-2xs` | Barely visible |
| `shadow-xs` | Extra small |
| `shadow-sm` | Small |
| `shadow-md` | Medium (default) |
| `shadow-lg` | Large |
| `shadow-xl` | Extra large |
| `shadow-2xl` | Huge |

## Color Palette (Slate Example)

| Class | Light Mode | Dark Mode |
|-------|------------|-----------|
| `slate-50` | Near white | - |
| `slate-100` | Lightest | - |
| `slate-200` | Lighter | - |
| `slate-300` | Light | - |
| `slate-400` | Medium light | - |
| `slate-500` | Medium | - |
| `slate-600` | Medium dark | - |
| `slate-700` | Dark | - |
| `slate-800` | Darker | - |
| `slate-900` | Darkest | - |
| `slate-950` | Near black | - |

## Angular Component Host Styles

Use the `host` property instead of `:host` CSS:

```typescript
@Component({
  selector: 'app-sidebar',
  host: { class: 'flex flex-col w-64 bg-white dark:bg-slate-900' },
  template: `...`
})
export class SidebarComponent {}
```

## Common Patterns

### Flex container
```html
<div class="flex items-center gap-3">
```

### Card
```html
<div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
```

### Button
```html
<button class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
```

### Input
```html
<input class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
```

### Truncate text
```html
<span class="truncate">Long text here...</span>
```

### Responsive hide/show
```html
<div class="hidden md:block">Visible on md+</div>
<div class="md:hidden">Visible below md</div>
```

### Focus ring
```html
<button class="focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
```

### Group hover
```html
<div class="group">
  <span class="opacity-0 group-hover:opacity-100">Appears on hover</span>
</div>
```

## Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Theme Variables](https://tailwindcss.com/docs/theme)
- [Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Functions & Directives](https://tailwindcss.com/docs/functions-and-directives)
