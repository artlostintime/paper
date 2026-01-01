# 🏗️ Architecture

## Project Structure

```
port/
├── server.js              # Node.js HTTP/HTTPS server
├── papers/                # Markdown papers storage
├── public/                # Static assets
│   ├── index.html        # Public homepage
│   ├── paper.html        # Individual paper viewer
│   ├── css/              # Stylesheets
│   │   └── main.css      # Main site styles
│   ├── js/               # JavaScript
│   │   └── main.js       # Main site logic
│   └── admin/            # Admin panel
│       ├── index.html    # Admin panel UI
│       ├── admin.css     # Admin panel styles
│       └── admin.js      # Admin panel logic
├── ssl/                   # SSL certificates (optional)
├── docs/                  # Documentation
└── .env                   # Environment variables
```

## Technology Stack

### Backend

- **Runtime:** Node.js (native HTTP/HTTPS modules)
- **Dependencies:** dotenv (environment variables only)
- **Storage:** File system (no database)
- **Authentication:** Session-based with in-memory storage

### Frontend

- **Framework:** Vanilla JavaScript (no framework)
- **Markdown:** marked.js (CDN)
- **Math:** KaTeX (CDN)
- **Security:** DOMPurify (CDN)
- **Fonts:** Google Fonts (Inter, Lora, Fira Code)
- **Icons:** Font Awesome 6

## Architecture Patterns

### Three-Layer Architecture

1. **Server Layer** ([`server.js`](../server.js))

   - HTTP/HTTPS request handling
   - Authentication and session management
   - File system operations (CRUD for papers)
   - Static file serving
   - API endpoints

2. **Public Site** ([`public/`](../public))

   - Portfolio homepage with paper grid
   - Individual paper viewer
   - Category filtering and search
   - Theme system

3. **Admin Panel** ([`public/admin/`](../public/admin))
   - Protected markdown editor
   - Live preview
   - File management
   - Export functionality

### Data Flow

```
Client Request
    ↓
Server (requestHandler)
    ↓
Auth Check (if protected route)
    ↓
Route Handler (API or Static)
    ↓
File System Operations
    ↓
JSON Response or Static File
    ↓
Client Renders
```

### Authentication Flow

```
1. User enters password → POST /api/auth/login
2. Server validates and creates session token
3. Token stored in HttpOnly cookie
4. Subsequent requests include token in cookie
5. Server validates token for protected routes
6. Session expires after 24 hours
```

## Key Design Decisions

### No Database

- **Reason:** Simple paper storage, no complex queries needed
- **Trade-off:** Limited scalability but simpler deployment
- **Files:** Papers stored as `.md` files in `papers/` directory

### Session-Based Auth

- **Reason:** Simple, secure, no external dependencies
- **Trade-off:** Sessions reset on server restart (acceptable for single-user)
- **Storage:** In-memory Map (could be Redis for production)

### Client-Side Rendering

- **Reason:** Simple deployment, no build step
- **Trade-off:** No SEO optimization for papers (acceptable for portfolio)
- **Rendering:** marked.js + KaTeX on client

### No Build Process

- **Reason:** Quick development, easy to understand
- **Trade-off:** No minification or tree-shaking
- **Files:** Direct HTML/CSS/JS files served as-is

## Security Architecture

### Headers

```javascript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000 (HTTPS only)
```

### CORS

- Restricted to `localhost:3000` and `localhost:3443`
- Credentials allowed for same-origin

### Authentication

- Password hashing with SHA-256 + random salt
- Rate limiting (5 attempts, 15min lockout per IP)
- HttpOnly cookies (no client-side access)
- 24-hour session expiration

### Input Sanitization

- DOMPurify for all markdown rendering
- Path traversal protection via `path.basename()`
- JSON parsing error handling

## Performance Considerations

### Caching

```javascript
// Static assets: 1 day cache
Cache-Control: public, max-age=86400
```

### Debouncing

- Search input: 300ms debounce
- Auto-save: 2 second debounce

### Code Splitting

- Admin panel separate from public site
- Each page loads only required assets

## Scalability Considerations

### Current Limitations

- In-memory sessions (lost on restart)
- Single-server deployment
- No CDN for static assets
- No database for metadata

### Future Improvements

- Redis for session storage
- Database for paper metadata (tags, categories)
- CDN for static assets
- Load balancing for multiple servers
- WebSocket for real-time collaboration

## File Format

### Paper Metadata

Papers use markdown frontmatter (potential future feature):

```yaml
---
title: Paper Title
author: Author Name
date: 2026-01-02
tags: [clinical, research]
category: Clinical Psychology
---
```

### Directory Structure

```
papers/
├── anxiety.md
├── burnout.md
├── cognition.md
└── ...
```

Papers sorted by modification time (newest first).

## API Endpoints

See [API.md](API.md) for detailed API documentation.
