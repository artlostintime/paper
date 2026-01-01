# Admin Panel Review & Improvements

## ✅ Current State (What's Working)

- Authentication system with session management
- Markdown editor with live preview
- File management (list, create, edit, delete)
- Templates and insert menus
- Keyboard shortcuts modal
- Autosave functionality
- Word/character counter
- Dark theme
- Fixed layout (no page scroll, individual panel scrolls)
- KaTeX math rendering

## 🔧 Issues Found & Fixes Applied

1. ✅ Admin panel JS not loading (404) - Fixed route handler
2. ✅ Toolbar scrolling issue - Made sticky/fixed
3. ✅ Sidebar header scrolling - Made sticky
4. ✅ Layout not filling viewport at zoom levels - Fixed height chain

## 🎯 Suggested QoL Improvements

### High Priority

1. **Line Numbers in Editor** - Easier navigation for long papers
2. **Auto-scroll Preview** - Preview follows editor scroll position
3. **Recent Papers Badge** - Visual indicator for recently edited files
4. **Unsaved Changes Warning** - Confirm before navigating away
5. **Search & Replace** - Find/replace text in editor
6. **Export Options** - Download as PDF/HTML

### Medium Priority

7. **Drag & Drop Upload** - Upload markdown files
8. **Syntax Highlighting** - Color code markdown syntax
9. **Split View Toggle** - Quick switch between editor/preview/both
10. **Font Size Controls** - Adjust editor font size
11. **Preview Sync Toggle** - Enable/disable live preview updates
12. **Paper Categories/Tags** - Organize papers by topic

### Low Priority

13. **Dark/Light Theme Toggle** - Theme switcher in header
14. **Vim Mode** - Optional Vim keybindings
15. **Distraction-Free Mode** - Hide sidebar/toolbar
16. **Paper Templates** - More built-in templates
17. **Backup Reminders** - Periodic backup suggestions
18. **Word Count Goals** - Set target word counts

## 🚀 Implementation Plan

### Phase 1: Critical Fixes (Completed)

- [x] Fix admin.js loading
- [x] Fix toolbar scrolling
- [x] Fix sidebar scrolling
- [x] Fix viewport height issues

### Phase 2: Quick Wins (Completed ✅)

- [x] Add unsaved changes warning
- [x] Add line numbers to editor
- [x] Add auto-scroll sync for preview
- [x] Add recent files indicator
- [x] Add Ctrl+F search in editor

### Phase 3: Feature Enhancements (In Progress ⚡)

- [x] Export to PDF/HTML/Markdown/Text
- [x] Drag & drop file upload
- [ ] Syntax highlighting
- [ ] Categories/tags system

### Phase 4: Polish

- [ ] Theme toggle
- [ ] Font size controls
- [ ] Distraction-free mode
- [ ] More templates
