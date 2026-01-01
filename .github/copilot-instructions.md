# Psychology Portfolio - AI Coding Instructions

## Project Overview

A psychology research portfolio website built with vanilla JavaScript, Node.js HTTP server, and markdown-based content. Features a public-facing paper showcase and a password-protected admin panel for content management.

## Architecture

### Three-Tier Structure

- **Server**: [server.js](../server.js) - Node.js HTTP server with authentication, session management, and REST API
- **Public Site**: [public/](../public/) - Portfolio homepage with paper grid and individual paper viewer
- **Admin Panel**: [public/admin/](../public/admin/) - Protected markdown editor with live preview

### Duplicate Files Pattern

The codebase maintains duplicates at root and in `public/` (e.g., [script.js](../script.js) ≈ [public/js/main.js](../public/js/main.js), [index.html](../index.html) ≈ [public/index.html](../public/index.html)). **Always update both locations** when modifying shared functionality.

## Critical Workflows

### Running the Server

```bash
node server.js
# Runs on http://localhost:3000
# Admin panel at http://localhost:3000/admin
```

**Authentication**: Set `ADMIN_PASSWORD` environment variable or edit [server.js](../server.js#L17). Default is `admin123` with a warning on startup.

### Adding Research Papers

1. Create markdown file in [papers/](../papers/) directory
2. Follow template structure: title, author line, abstract, sections, math equations
3. No server restart needed - files are read dynamically via `/api/papers` endpoint

## Key Conventions

### Markdown Rendering

- Uses `marked.js` (CDN) for client-side markdown parsing
- Math equations: inline `$...$` and display `$$...$$` rendered with KaTeX
- Preview generation: first ~500 chars of content after title/author for paper grid

### Authentication System

- **Session-based**: Tokens stored in-memory Map (resets on server restart)
- **Rate limiting**: 5 failed attempts → 15-minute lockout per IP
- **Password hashing**: SHA-256 with random salt generated on startup
- **Protected routes**: Only `/api/papers` POST/PUT/DELETE require auth; GET is public
- Check [server.js](../server.js#L15-L105) for complete auth implementation

### API Endpoints

```javascript
GET  /api/papers           // List all .md files with metadata
GET  /api/papers/:filename // Get paper content
POST /api/papers/save      // Save/update paper (auth required)
POST /api/papers/delete    // Delete paper (auth required)
POST /api/auth/login       // Authenticate with password
POST /api/auth/logout      // Clear session
GET  /api/auth/check       // Verify authentication status
```

### Frontend State Management

- **Theme**: Persisted in `localStorage` as `"theme"` (dark/light)
- **Admin unsaved changes**: Tracked with `hasUnsavedChanges` boolean + autosave timer
- **Paper metadata**: Server returns `mtime` and `size` for sorting and "recent" badges

### CSS Architecture

- Single dark/light theme system using `[data-theme]` attribute on `<html>`
- CSS custom properties (variables) in `:root` for easy theming
- Mobile-first responsive design with side panel navigation

## Integration Points

### External Dependencies

- **marked.js**: Markdown parser loaded from CDN in all HTML files
- **KaTeX**: Math rendering loaded from CDN
- **Font Awesome**: Icons for UI elements
- **dotenv**: Only server-side dependency (for `ADMIN_PASSWORD` env var)

### File System Interaction

- **Papers directory**: [papers/](../papers/) - direct filesystem reads/writes via Node.js `fs` module
- **No database**: All content stored as `.md` files, server provides CRUD API layer
- **Sorting**: Papers sorted by file modification time (`mtime`) newest first

## Security Notes

- CORS restricted to `localhost:3000` and `127.0.0.1:3000`
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
- HttpOnly cookies for session tokens (no client-side access)
- Path traversal protection via `path.basename()` on filenames
- Sessions expire after 24 hours

## Development Patterns

- **No build step**: Pure vanilla JS, HTML, CSS - edit and refresh
- **Minimal dependencies**: Only `dotenv` in package.json
- **Error handling**: Toast notifications in admin, console logs for debugging
- **Autosave**: 2-second debounce on editor changes in admin panel
