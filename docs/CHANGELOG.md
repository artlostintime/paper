# 📝 Changelog

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
