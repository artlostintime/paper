# 🧠 Psychology Portfolio

A clean, fast portfolio site for psychology research papers. Write in Markdown, manage through a VS Code-style admin panel, and publish instantly — no database needed.

## Quick Start

```bash
npm install
node server.js
```

Open **http://localhost:3000** — that's it.  
Admin panel lives at **http://localhost:3000/admin** (default password: `admin123`).

---

## What This Is

A self-hosted website that turns Markdown files into a polished research portfolio. You drop `.md` files into a folder (or write them in the built-in editor), and they show up on your site with categories, search, math rendering, and citations.

**Public site** — readers browse your papers with search, category filters, and a clean reading experience.  
**Admin panel** — you write and manage papers in a VS Code-style editor with live preview.

---

## Features

### The Editor

- Split-pane Markdown editor with **live preview**
- **Syntax highlighting** right in the textarea (headings, bold, code, math, etc.)
- **Slash commands** — type `/` for quick insertions (headings, links, tables, math...)
- **Auto-pairs** — brackets, quotes, and markdown markers auto-close and wrap selections
- **List continuation** — press Enter after a list item to auto-continue
- **Find & Replace** (Ctrl+F / Ctrl+H) with regex and case-sensitive modes
- **Line numbers**, word count, cursor position
- **7 paper templates** — Research, Literature Review, Clinical Case, Experiment, etc.
- **YAML frontmatter** support for metadata (title, author, date, tags)
- **Drag & drop** `.md` files directly into the editor
- **Export** to Markdown, HTML, Plain Text, or PDF
- **Autosave** with 3-second debounce
- **Undo/redo** works correctly (all edits are undo-safe)
- **Zen mode** (F11) — distraction-free fullscreen writing

### The Public Site

- Papers displayed as cards with category badges, reading time, and "New" indicators
- **Server-side search** with category filtering
- **7 auto-categories** based on filename (Clinical, Cognitive, Social, Health, etc.)
- Dark/light theme with no flash on load
- **KaTeX** math rendering (inline `$...$` and display `$$...$$`)
- **Citation system** — APA, MLA, Chicago, Harvard, BibTeX with one-click copy
- Reading progress bar, social sharing, APA-formatted print
- Responsive design — works on mobile

### Security

- **bcrypt** password hashing (12 rounds)
- **Rate limiting** — 5 failed logins → 15-minute lockout
- **24-hour sessions** with HttpOnly cookies
- **Helmet** CSP headers, CORS restricted to localhost
- **CSRF** origin validation on all POST requests
- **DOMPurify** sanitization on all rendered HTML (including exports)
- Optional HTTPS with auto-redirect

---

## Project Structure

```
paper/
├── server.js              # Express server (auth, API, static files)
├── papers/                # Your .md files live here
├── public/
│   ├── index.html         # Public homepage
│   ├── paper.html         # Single paper reader
│   ├── css/main.css       # Compiled styles
│   ├── js/
│   │   ├── main.js        # Homepage logic
│   │   ├── paper.js       # Paper reader logic
│   │   └── theme-init.js  # Prevents theme flash
│   └── admin/
│       ├── index.html     # Admin panel
│       ├── admin.js       # Editor logic (~2600 lines)
│       └── admin.css      # Compiled admin styles
├── src/scss/              # SCSS source (7-folder architecture)
├── docs/                  # Documentation
└── package.json
```

---

## Writing Papers

### Option 1: Admin Panel

1. Go to `/admin` and log in
2. Click **New Paper** (or Ctrl+N)
3. Pick a template or start from scratch
4. Write your paper — preview updates live
5. Hit **Save** (Ctrl+S)

### Option 2: Just Drop a File

Create a `.md` file in the `papers/` folder. The server picks it up automatically — no restart needed.

### Paper Format

```markdown
---
title: My Research Paper
author: Your Name
date: 2026-01-15
tags: [burnout, psychology, mixed-methods]
category: Health
---

# My Research Paper

_Your Name • Published 2026_

## Abstract

Your abstract here...

## Introduction

Content with inline math: $M = 25.3$, $SD = 4.2$

Display equations:
$$r = .45, p < .001$$

## Method

...

**Reference:**
Author, A. (2026). Title. _Journal_, 1(2), 10-20. https://doi.org/xxxxx

[Read Full Article](https://doi.org/xxxxx)
```

The YAML frontmatter (between `---`) is optional but recommended — it's hidden in previews and used for metadata.

---

## Categories

Papers are auto-categorized by **filename keywords**:

| Category      | Keywords                                   | Example filename          |
| ------------- | ------------------------------------------ | ------------------------- |
| Clinical      | anxiety, depression, psychotherapy, trauma | `anxiety-treatment.md`    |
| Cognitive     | cognition, memory                          | `memory-consolidation.md` |
| Social        | social, attachment                         | `social-media-effects.md` |
| Health        | burnout, sleep, addiction                  | `burnout-teachers.md`     |
| Developmental | developmental                              | `developmental-stages.md` |
| Neuroscience  | neuroscience                               | `neuroscience-emotion.md` |
| Personality   | personality, motivation                    | `motivation-theory.md`    |

No match → **Other**. Categories are defined once in `server.js` and served via API.

---

## Configuration

### Password

Create a `.env` file:

```
ADMIN_PASSWORD=your_secure_password
```

Or set it as an environment variable. If you don't set one, it defaults to `admin123` (with a console warning).

### Server Options

All configurable in `server.js` or via environment variables:

| Setting            | Default    | Env Variable |
| ------------------ | ---------- | ------------ |
| Port               | 3000       | `PORT`       |
| HTTPS Port         | 3443       | `HTTPS_PORT` |
| Enable HTTPS       | false      | `USE_HTTPS`  |
| Session length     | 24 hours   | —            |
| Failed login limit | 5 attempts | —            |
| Lockout duration   | 15 minutes | —            |

### SCSS

Styles are written in SCSS (53 partials, 7-folder architecture) and compiled to CSS:

```bash
npm run scss          # Compile once
npm run scss:watch    # Watch for changes
npm run build         # Compressed production build
```

---

## API

| Method | Endpoint                                | Auth | Description                                     |
| ------ | --------------------------------------- | ---- | ----------------------------------------------- |
| GET    | `/api/papers`                           | No   | List papers (with `?sort=date\|name\|category`) |
| GET    | `/api/papers/:file`                     | No   | Get single paper                                |
| GET    | `/api/papers/batch?files=a.md,b.md`     | No   | Get multiple papers                             |
| GET    | `/api/papers/search?q=...&category=...` | No   | Search papers                                   |
| GET    | `/api/categories`                       | No   | Get category map                                |
| POST   | `/api/papers/save`                      | Yes  | Create/update paper                             |
| POST   | `/api/papers/delete`                    | Yes  | Delete paper                                    |
| POST   | `/api/auth/login`                       | No   | Login                                           |
| POST   | `/api/auth/logout`                      | No   | Logout                                          |
| GET    | `/api/auth/check`                       | No   | Check auth status                               |

---

## Keyboard Shortcuts

### General

| Shortcut     | Action                             |
| ------------ | ---------------------------------- |
| Ctrl+S       | Save                               |
| Ctrl+N       | New Paper                          |
| Ctrl+P       | Command Palette                    |
| Ctrl+B       | Toggle Sidebar (or Bold in editor) |
| Ctrl+Shift+T | Toggle Theme                       |
| F11          | Zen Mode                           |
| Esc          | Close modals / Exit Zen            |

### Editor

| Shortcut        | Action          |
| --------------- | --------------- |
| Ctrl+B          | Bold            |
| Ctrl+I          | Italic          |
| Ctrl+K          | Insert Link     |
| Ctrl+D          | Duplicate Line  |
| Ctrl+F          | Find            |
| Ctrl+H          | Find & Replace  |
| Tab / Shift+Tab | Indent / Dedent |
| Ctrl+\+/\-      | Font Size       |
| /               | Slash commands  |

---

## Deployment

### Vercel / Render / Railway

Push to GitHub, import into your platform, set `ADMIN_PASSWORD` as an env variable. It auto-detects Node.js.

### Self-Hosted

```bash
npm install -g pm2
pm2 start server.js --name portfolio
pm2 startup && pm2 save
```

---

## Troubleshooting

**Papers not loading?** Make sure the server is running (`node server.js`) and you're accessing `http://localhost:3000`, not opening the HTML file directly.

**Can't log in?** Check your password in `.env`. If you've failed 5 times, wait 15 minutes or restart the server.

**Styles look wrong?** Hard refresh with Ctrl+Shift+R. If you edited SCSS, run `npm run scss`.

**Math not rendering?** KaTeX loads from CDN — you need internet. Use `$...$` for inline, `$$...$$` for display.

---

## Tech Stack

| Layer             | Technology                 |
| ----------------- | -------------------------- |
| Server            | Express 5, Node.js         |
| Auth              | bcrypt, in-memory sessions |
| Security          | Helmet, CORS, DOMPurify    |
| Markdown          | marked.js                  |
| Math              | KaTeX                      |
| Code highlighting | highlight.js 11.9.0        |
| Styles            | SCSS (sass CLI)            |
| Fonts             | Inter + Lora + Fira Code   |
| Icons             | Font Awesome 6             |

### Dependencies

**Production:** express, bcrypt, helmet, cors, compression, cookie-parser, dotenv, gray-matter  
**Dev:** sass, nodemon

---

## Docs

See [`docs/`](docs/) for more:

- [Getting Started](docs/GETTING_STARTED.md)
- [Admin Guide](docs/ADMIN_GUIDE.md)
- [Features](docs/FEATURES.md)
- [Shortcuts](docs/SHORTCUTS.md)
- [API Reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Changelog](docs/CHANGELOG.md)

---

**Version:** 4.2.0 · **Node.js:** 18+ · **License:** Open source
