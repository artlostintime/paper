# 📝 Changelog

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
