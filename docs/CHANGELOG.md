# 📝 Changelog

## [4.2.1] - March 1, 2026

### 🐛 Bug Fixes

#### Undo/Redo Consistency

- **Fixed**: Auto-pairs (brackets, quotes, markdown wrappers) were using `editor.value =` directly, breaking undo history. All 3 code paths now use `editorReplaceRange()` for undo-safe editing.
- **Fixed**: Drag-and-drop file loading set `editor.value = text`, destroying undo stack. Now uses select-all + `editorInsertText()`.
- **Fixed**: Template application set `editor.value = templates[tpl]`, breaking undo. Same fix applied.

#### YAML Frontmatter Stripping (Public Pages)

- **Fixed**: Both `main.js` and `paper.js` used `indexOf("\n---", 4)` to find the end of YAML frontmatter. This could match horizontal rules (`---`) inside paper content and strip everything above them. Replaced with `/\n---\s*\n/` regex (matches `---` only when surrounded by blank lines), matching the fix already applied to the admin preview.

#### Autocomplete HR Rendering

- **Fixed**: Slash-command autocomplete for horizontal rule inserted `\n---\n` (single newlines). When preceded by text, `marked` would render this as a setext heading instead of `<hr>`. Changed to `\n\n---\n\n` (double newlines), consistent with the quick-format bar fix.

#### paper.js Null Reference Crashes

- **Fixed**: `progressBar`, `citeBtn`, `citeDropdown`, `citeCopyBtn`, `shareBtn`, `shareDropdown`, `copyLinkBtn`, and `printBtn` were accessed without null checks, causing crashes if any element was missing from the DOM. All references now guarded with `if (el)` checks.

### 🔒 Security

#### XSS in Export & Print

- **Fixed**: `exportPaper("html")` and `printPaper()` injected `marked.parse(content)` into `document.write()` without sanitization. Both now run output through `DOMPurify.sanitize()` before injection, matching the preview pane's existing protection.

### ⚡ Performance

#### Debounced Expensive Operations

- Preview rendering (`marked.parse` + DOMPurify + KaTeX + hljs) now debounced at 200ms instead of running on every keystroke.
- Syntax highlighting (multi-pass regex) now debounced at 40ms, eliminating input lag on long documents.

#### Line Numbers Optimization

- `updateLineNumbers()` no longer rebuilds all line `<div>`s via `innerHTML` on every keystroke. Now diffs the line count and only appends/removes elements as needed using a `DocumentFragment`.

### ✨ Improvements

#### Autocomplete Positioning

- Character width for cursor positioning now scales with `editorFontSize * 0.6` instead of a hardcoded `7.5px`. Autocomplete dropdown is correctly positioned across all font sizes (10–24px).

#### Keyboard Shortcuts Modal

- Added missing **Ctrl+F** (Find) and **Ctrl+H** (Find & Replace) entries to the shortcuts modal in `admin/index.html`.

#### Admin Theme Flash Prevention

- Added inline `<script>` in admin `<head>` to read `localStorage("admin-theme")` and set `data-theme` before first paint, preventing a flash of wrong theme on load. (Public pages already had this via `theme-init.js`.)

#### README Rewrite

- Completely rewrote `README.md` — shorter, scannable, no outdated info. Covers quick start, features, project structure, paper format, categories, config, API, shortcuts, deployment, and troubleshooting in a flat, easy-to-read structure.

---

## [4.2.0] - March 1, 2026

### ✨ Syntax Highlighting & Editor Intelligence

Major editor upgrade with real-time markdown syntax highlighting, intelligent auto-completion, and smart editing aids.

#### Syntax Highlighting (Editor Overlay)

- Transparent-textarea overlay technique using CSS Grid stacking of `<pre><code>` and `<textarea>` in the same cell
- Custom `highlightMarkdown()` tokenizer colorizes 16+ markdown elements in real-time:
  - **Headings** (amber), **Bold** (gold), **Italic** (warm gray), **Bold+Italic** combined
  - **Inline code** (blue), **Fenced code blocks** with language tag highlighting (green)
  - **Links** (green text + blue underlined URL), **Images** (purple)
  - **Blockquotes** (muted olive), **List markers** (amber bold)
  - **Math** blocks and inline (purple), **HTML tags** (blue)
  - **Strikethrough** (gray with line-through), **Frontmatter** (olive italic)
  - **Horizontal rules**, **Table separators**
- Textarea uses `color: transparent` / `-webkit-text-fill-color: transparent` with `caret-color: var(--accent)` for visible cursor
- Placeholder text retains visibility via `-webkit-text-fill-color` override

#### Preview Code Highlighting

- Integrated **highlight.js 11.9.0** (github-dark-dimmed theme) for fenced code blocks in the live preview
- Code blocks automatically highlighted after each `updatePreview()` call

#### Slash Command Autocomplete

- Type `/` in the editor to trigger a floating autocomplete dropdown
- **19 built-in snippets**: headings (H1–H3), bold, italic, strikethrough, inline code, code block, link, image, blockquote, unordered list, ordered list, task list, horizontal rule, table, math block, inline math, footnote
- Keyboard navigation: `↑`/`↓` to select, `Enter`/`Tab` to apply, `Escape` to dismiss
- Dropdown positioned near cursor with glass-styled panel, icon + label + hint per item
- Intelligent cursor placement after insertion (e.g., cursor lands between `**|**` for bold)

#### Auto-Pairs & Smart Editing

- **Bracket auto-close**: `(`, `[`, `{` auto-insert their closing pair when followed by whitespace/EOL
- **Selection wrapping**: Selecting text then typing `*`, `_`, `` ` ``, `~`, `$`, `"`, `'` wraps both sides around the selection
- **Closing char skip**: Typing a closing bracket when cursor is adjacent skips over it
- **List continuation**: Pressing Enter after a list item auto-continues with the next item:
  - Unordered (`-`, `*`, `+`), Ordered (auto-increments number), Task lists (`- [ ]`)
  - Pressing Enter on an empty list item removes it and ends the list

### 🐛 Bug Fixes

#### Zen Mode Preview

- **Fixed**: Preview pane was hidden in distraction-free/Zen mode — removed `.preview-pane` from the hidden elements list in `_distraction-free.scss`
- Added zen-mode-specific preview styling: centered content, max-width `820px`, comfortable `1.1rem` font, `1.85` line-height
- Added floating **Zen Toolbar** with glass effect: Split / Editor / Preview / Exit buttons
  - Toolbar appears on hover (0.6 → 1.0 opacity transition)
  - View buttons sync bidirectionally with the main view-toggle controls
  - Exit button calls `toggleDistractionFree()` to leave Zen mode
- Zen mode now defaults to split view on entry and syncs toolbar active state

#### Search Panel Cleanup

- Removed redundant sidebar search panel (HTML + JS) since the command palette already provides universal search
- Deleted: search activity-bar button, `#panel-search` view, `searchInput`/`searchResults` DOM refs, `renderSearchResults()`, search debounce handler, `searchQuery` state variable
- Simplified `renderPaperList()` to remove search filtering logic

### 🎨 UI Visibility & Readability Improvements

#### Typography & Sizing

- Base font increased to `0.875rem` (from `0.8125rem`)
- Status bar: `0.72rem` (from `0.65rem`), uses `--text-secondary` (from `--text-muted`)
- Titlebar: title and command trigger at `0.78rem`, buttons `0.78rem`
- Sidebar: tree items `0.8rem` with 28px min-height, panel titles `0.7rem`, section toggles `0.72rem`
- Tabs: `0.8rem` with increased padding, breadcrumbs `0.78rem`
- Quick-format buttons: `0.75rem` at 28×26px, activity labels `0.55rem` at 0.8 opacity

#### Layout Token Updates

- Titlebar: 38px (from 36px), Activity bar: 48px (from 46px), Status bar: 26px (from 22px)
- Tab bar: 36px (from 34px), Breadcrumb bar: 30px (from 28px), Quick-format bar: 32px (from 28px)
- Activity buttons: 44px height (from 40px), Command trigger: 420px width

#### Status Bar Redesign

- Background changed from amber-tinted `#1c1b18` to neutral `#1e1e22`
- Border-top changed from amber `rgba(212,168,83,0.08)` to subtle `rgba(255,255,255,0.06)`
- Text color upgraded to `--text-secondary` for better contrast
- Status items: increased padding (`0 8px`), `gap: 4px`, hover brightens to `--text-primary`

#### Text Overflow Prevention

- Tree labels: `@include truncate` + `flex: 1` + `min-width: 0` to prevent sidebar text overflow
- Breadcrumb input: `max-width: 180px` with `@include truncate`
- Tree items: `overflow: hidden` on container, increased padding (`5px 12px 5px 18px`)
- Breadcrumb bar: `overflow: hidden` to contain long paths

### 📦 Dependencies

- Added **highlight.js 11.9.0** CDN (CSS: `github-dark-dimmed` theme + JS runtime)

---

## [4.1.0] - June 2, 2025

### 🖥️ VS Code–Inspired Admin Panel Overhaul

Complete redesign and rewrite of the admin panel, modeled after Visual Studio Code's layout and interaction patterns.

#### Layout Architecture

- **Titlebar**: App-region drag bar with icon, title, centered command trigger (`Ctrl+P`), and action buttons (site link, settings, logout)
- **Activity Bar**: Vertical icon rail (46px) with labeled buttons for Explorer, Search, Templates, and bottom-docked Settings/Shortcuts; active state with amber left-border indicator
- **Side Panel**: Collapsible 260px panel with file tree, section toggles, search box, and resize sash; smooth width + opacity transition on collapse
- **Editor Group**: Tab bar with unsaved-dot indicator and active tab accent stripe, breadcrumb bar with inline slug editor, quick-format toolbar (bold, italic, heading, link, image, code, list, quote, hr, table, math)
- **Split Editor + Preview**: Side-by-side markdown editor with line numbers and live preview (marked + DOMPurify + KaTeX); draggable split sash; three view modes (split, editor-only, preview-only)
- **Status Bar**: Dark tinted bar (`#1c1b18`) with cursor position, word count, autosave indicator, font size controls, and save status badge
- **Command Palette**: Modal overlay with fuzzy-search file picker and keyboard navigation

#### admin.js Rewrite

- Streamlined from ~1,600 lines to ~850 lines with cleaner module organization
- Full feature set: authentication, CRUD operations, live markdown preview, line numbers, cursor tracking, word count, autosave with debounce, template insertion, multi-format export (MD/HTML/TXT/PDF), keyboard shortcuts, distraction-free/Zen mode, resizable sashes

#### SCSS Architecture

- **13 admin partials**: `_base`, `_login`, `_buttons`, `_layout`, `_sidebar`, `_editor`, `_controls`, `_editor-content`, `_toast`, `_modal`, `_distraction-free`, `_responsive`, forwarded via `_index.scss`
- **Shared abstracts**: Extracted `_variables.scss` (breakpoints, z-index, motion, layout, radius, spacing tokens) and `_mixins.scss` (`respond-to`, `flex-center`, `glass`, `card`, `truncate`, `stagger`, `hover-lift`, `label`)
- Admin entry point `admin.scss` uses shared `base` reset/theme and admin-specific `admin/index`

### 🎨 UI Polish Pass

Comprehensive refinement of colors, typography, spacing, and interaction across all admin SCSS partials.

#### Typography & Sizing

- Base font size set to `0.8125rem` with antialiased rendering (`-webkit-font-smoothing`, `-moz-osx-font-smoothing`, `text-rendering: optimizeLegibility`)
- Tightened font sizes across all components: tabs `0.75rem`, breadcrumbs `0.72rem`, tree items `0.76rem`, line numbers `0.78rem`, preview `0.85rem`
- Custom `::selection` styling with accent-soft background

#### Spacing & Density

- Reduced heights: titlebar 36px, tab bar 34px, breadcrumb bar 28px, quick-format bar 28px, status bar 22px, activity buttons 40px
- Tighter padding on tree items (`3px 12px 3px 18px`, 24px min-height), section toggles, panel headers (34px), and tab actions
- Sashes refined to 3px width with `rgba(212, 168, 83, 0.4)` hover color

#### Color & Interaction

- Status bar redesigned from solid amber to dark tinted background with muted text and subtle amber border-top
- View toggle uses `rgba(212, 168, 83, 0.15)` amber tint for active state instead of solid color
- All hover/active states use `rgba()` backgrounds for subtlety: tree items `0.04`/`0.08`, section toggles `0.02`/`0.04`
- Command palette shadow deepened to `0 8px 40px rgba(0, 0, 0, 0.5)`

### 🐛 Bug Fixes

- Fixed side panel collapse toggle — JS now correctly toggles `.collapsed` class on `.side-panel`
- Fixed dropdown/modal class mismatch — all use `.active` instead of `.show`
- Fixed distraction-free mode targeting correct `.admin-app` container

### 📱 Responsive

- Tablet: Activity bar narrows to 38px, labels hidden, side panel becomes fixed overlay with translateX collapse
- Mobile: Title hidden, view toggle hidden, status bar items filtered to essential controls only

---

## [4.0.0] - March 1, 2026

### 🎨 UI Reimagining — "Ink & Light"

Complete visual overhaul of the entire application with a modern, high-readability design system.

#### Design System

- **Color palette**: Charcoal/slate dark theme (`#101014`) with warm amber/gold accent (`#d4a853`), replacing the previous terracotta scheme
- **Light theme**: Warm paper (`#f7f5f2`) with deep amber accent (`#b8892e`)
- **Glassmorphism**: `backdrop-filter: blur()` on panels, dropdowns, toasts, and interactive elements
- **Shadow scale**: `--shadow-sm/md/lg/glow` with accent-colored glow variant
- **Spacing scale**: Consistent `$space-xs` through `$space-4xl` tokens throughout

#### Typography & Readability

- Fluid typography with `clamp()` for responsive heading sizes
- Body text at `1.0625rem` with `line-height: 1.8` for optimal reading
- Gradient section dividers replacing plain `<hr>` elements
- Custom thin scrollbars (6px) with rounded thumbs

#### Components Redesigned

- **Hero section**: 80vh with accent line, fluid title sizing, animated scroll cue
- **Paper cards**: Card with gradient accent stripe on hover, glow shadow, staggered entrance animation
- **Search**: Pill-shaped input with accent focus ring and glass filter pills
- **Timeline**: Horizontal scrollable with glass year badges, glowing dot markers
- **Tech grid**: Card-based layout with hover-lift and accent borders
- **Contact**: Glass email box, pulse-dot availability badge, brand-color social hovers
- **Side panel**: Dark glass with active indicator bars, amber theme toggle
- **Paper reader**: Glass sticky header with gradient reading progress bar

#### Motion & Interaction

- Spring easing curves: `cubic-bezier(0.34, 1.56, 0.64, 1)` for playful feedback
- `hover-lift` mixin: `translateY(-4px)` + shadow elevation on card hover
- Section reveal with `fadeInUp` on scroll intersection
- Menu button icon rotates 90° on hover

#### Admin Panel

- Cohesive design with the main site's new token system
- Glass modals with scale+translate entrance animation
- Distraction-free mode for focused writing
- Improved responsive layout for mobile editing

#### Infrastructure

- All SCSS partials rebuilt from scratch (40+ files)
- Added missing z-index tokens: `$z-dropdown`, `$z-loader`, `$z-modal`
- Radius scale: `$radius-sm/md/lg/xl/full` for consistent rounding
- Updated inline critical CSS in `index.html` to match new design

---

## [3.1.0] - March 1, 2026

### 🏗️ CSS → SCSS Migration

Migrated the entire stylesheet codebase from plain CSS to SCSS using the modern `@use`/`@forward` module system and the `sass` CLI compiler.

#### Architecture

- Organized styles into a **7-folder structure**: `abstracts/`, `base/`, `layout/`, `components/`, `features/`, `utilities/`, `admin/`
- Created **53 SCSS partials** from the two monolithic CSS files (`main.css` at 2035 lines, `admin.css` at 1031 lines)
- Entry points: `src/scss/main.scss` → `public/css/main.css`, `src/scss/admin.scss` → `public/admin/admin.css`

#### SCSS Features Used

- **Variables** (`$bp-mobile`, `$bp-tablet`, `$z-menu-btn`, `$ease-fast`, etc.) for compile-time breakpoints, z-index scale, transitions, and layout constants
- **Mixins** (`respond-to`, `respond-above`, `flex-center`, `flex-between`, `card`, `truncate`, `stagger`, `hover-accent`) to eliminate repetitive patterns
- **Nesting** with parent selectors (`&:hover`, `&.active`, `&::before`) throughout all partials
- **`@for` loops** for stagger animation delays on paper cards and timeline items
- **CSS custom properties** preserved on `:root` / `[data-theme="light"]` for runtime dark/light theming

#### Build Scripts

- `npm run scss` — one-time expanded compilation
- `npm run scss:watch` — file-watching mode for development
- `npm run build` — compressed production output (no source maps)

#### No Breaking Changes

- HTML references unchanged — compiled CSS outputs to the same `public/css/main.css` and `public/admin/admin.css` paths
- Visual output is identical to the previous plain CSS

### 📦 Dependencies

- Added `sass` as a dev dependency

---

## [3.0.0] - March 1, 2026

### 🔒 Security

#### Path Traversal Prevention

- Added strict `VALID_FILENAME` regex (`/^[\w-]+\.md$/`) on all file API routes
- Blocks directory traversal attacks (`../../etc/passwd` etc.)

#### Content Security Policy

- Replaced disabled CSP (`contentSecurityPolicy: false`) with full directive set
- Whitelisted only required CDN sources (fonts.googleapis, cdn.jsdelivr, cdnjs.cloudflare)

#### CSRF Protection

- Added origin/referer validation middleware for all POST requests
- Allows same-origin requests; blocks cross-origin state-changing calls

#### Request Limits

- `express.json()` now enforced with `{ limit: "1mb" }` to prevent payload abuse

### 🚀 Performance

#### Gzip Compression

- Added `compression` middleware — all responses are now gzip-compressed

#### Async I/O

- Replaced all `fs.readFileSync` / `fs.readdirSync` with `fs.promises` equivalents
- Server no longer blocks the event loop during file operations

#### In-Memory Search Index

- Search queries now hit an in-memory `Map` instead of reading every file from disk
- Index auto-invalidates on save/delete operations

#### Batch API

- New `GET /api/papers/batch?files=a.md,b.md` endpoint
- Frontend fetches all visible papers in a single request (resolves N+1 problem)

#### Static File Caching

- `express.static` now serves with `maxAge: "1d"` headers

### 🎉 New Features

#### Categories API

- New `GET /api/categories` endpoint serves category map as single source of truth
- Frontend loads categories from server instead of maintaining a duplicate map

#### Sorting

- `GET /api/papers` now accepts `?sort=date|name|category` query parameter
- Papers sortable by modification date, alphabetical name, or category grouping

#### 404 Error Pages

- API routes return structured JSON `{ error: "Not found" }`
- Non-API routes return a themed HTML page with navigation back to home

#### Global Error Handler

- Unhandled exceptions caught gracefully with stack traces in development

#### Admin Mobile Preview Toggle

- Floating button on mobile to switch between editor and preview panes
- Toggles icon between eye (preview) and code (editor) states

### ✨ UI/UX Improvements

#### Hero Intro Section

- Introduction section now uses `min-height: 70vh` centered layout
- Added "Scroll to explore" cue with animated chevron (fades on scroll)

#### Paper Card Micro-Interactions

- Staggered entrance animation — cards slide in sequentially
- Accent-colored left border scales up on hover

#### Search Bar Enhancement

- Keyboard hint badge (`/`) shown inside the search input
- Hint fades when the input is focused or has content

#### Footer

- Added minimal site footer with name, copyright range, and tagline
- Page no longer ends abruptly after the last section

#### Better Empty States

- "No results" message now displays a search icon above the text

#### Paper Count Transition

- Count text fades in smoothly instead of appearing instantly

### ♿ Accessibility

- Added skip-to-content link (visible on keyboard focus)
- Added `:focus-visible` outlines on all interactive elements
- Added `prefers-reduced-motion` media query — all animations instantly resolve for users who prefer reduced motion

### 🐛 Bug Fixes

#### Category Typos

- Fixed `psychothearapy` → `psychotherapy` in category map
- Fixed `motivition` → `motivation` in category map

#### Placeholder Links

- Replaced `yourusername` social links with actual profile URLs + TODO comments

### 🧹 Code Cleanup

- Removed ~180 lines of duplicate timeline CSS (was defined twice in main.css)
- Removed dead sort-controls CSS and responsive rules after feature removal
- Consolidated category map — single source on server, no frontend duplicate
- Sort controls feature added then removed per user request (CSS fully cleaned)

### 📦 Dependencies

- Added `compression` package for gzip middleware

### 📄 Configuration

- Updated `.env.example` with HTTPS fields (`HTTPS_PORT`, `USE_HTTPS`, `SSL_KEY_PATH`, `SSL_CERT_PATH`)

---

## [2.1.0] - January 2, 2026

### 🎉 New Features

#### YAML Frontmatter Support

- Added `gray-matter` package for YAML frontmatter parsing
- Server API now returns structured `{content, frontmatter, raw}` data
- YAML button in admin toolbar for quick frontmatter insertion
- All 7 templates updated with YAML metadata blocks
- Auto-fills filename as title and current date
- Checks for existing YAML to prevent duplicates

#### Preview Improvements

- YAML frontmatter now hidden in all preview contexts:
  - Admin panel live preview
  - Public site paper grid
  - Full paper viewer (paper.html)
- Raw YAML still visible in editor for editing

### ✨ Improvements

- Introduction section rewritten with more engaging copy
- Timeline updated with accurate milestones
- Backward compatible: papers without YAML still work

---

## [2.0.0] - January 2, 2026

### 🎉 Major Features

#### Export System

- Added export to Markdown, HTML, Plain Text, and PDF
- PDF export opens print dialog with formatted paper only
- HTML export includes embedded CSS and KaTeX rendering

#### Theme System

- Added light/dark theme toggle
- Persistent theme preference via localStorage
- Keyboard shortcut: `Ctrl+Shift+T`

#### Font Size Controls

- Adjustable font size (10px - 24px)
- Persistent font preference
- Keyboard shortcuts: `Ctrl++` and `Ctrl+-`

#### Distraction-Free Mode

- Full-screen writing mode (press `F11`)
- Hides all UI chrome for focused writing
- Exit with `Esc` key

#### Drag & Drop Upload

- Drop `.md` files directly into editor
- Visual feedback during drag
- Auto-fills filename and content

#### Extended Templates

- Added Clinical Case Study template
- Added Experiment Report template
- Added Paper Summary/Review template

### 🐛 Bug Fixes

#### Critical Fixes

- Fixed admin.js 404 error (incorrect route handler)
- Fixed toolbar scrolling with content (now sticky)
- Fixed sidebar header scrolling (now sticky)
- Fixed layout not filling viewport at different zoom levels
- Fixed empty space at bottom in distraction-free mode

#### Export Fixes

- Fixed PDF export printing entire website instead of just paper
- Fixed syntax error in export menu code

### ✨ Improvements

#### Editor Enhancements

- Auto-scroll sync between editor and preview
- Line number visual guides
- Monospace Fira Code font for better readability
- Native browser find support (`Ctrl+F`)

#### UI/UX Polish

- Smooth animations and transitions
- Toast notifications for actions
- Recent file indicator infrastructure
- Unsaved changes warning before closing
- Updated keyboard shortcuts modal

#### Layout Improvements

- VS Code-style independent panel scrolling
- Proper height chain (html → body → app)
- Fixed height filling at all zoom levels (25%, 33%, 50%, 100%)
- Better responsive design

### 📚 Documentation

- Created comprehensive admin guide
- Added keyboard shortcuts reference
- Added feature documentation
- Added getting started guide
- Updated changelog

---

## [1.0.0] - December 18, 2025

### Security

- Added CORS restrictions to localhost only
- Added security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- Added DOMPurify for XSS protection in markdown rendering
- Added markdown sanitization in all render points

### Performance

- Added static asset caching (1 day for CSS/JS/images)
- Added search debouncing (300ms delay)

### Code Quality

- Fixed filename typos in papers directory
- Added CORS credentials header
- Fixed authentication cookie handling

---

## Initial Release

### Features

- Node.js HTTP server with routing
- Markdown-based paper system
- Admin panel with authentication
- Live preview with KaTeX math rendering
- File management (create, edit, delete)
- Template system
- Word/character counter
- Dark theme
- Keyboard shortcuts
