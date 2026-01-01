# 🧠 Psychology Portfolio

A modern, minimalist portfolio website for psychology research papers, built with vanilla JavaScript and a markdown-based content system.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the server
node server.js
```

Visit `http://localhost:3000` for the public site or `http://localhost:3000/admin` for the admin panel.

**Default admin password:** `admin123`

## 📚 Documentation

See the [`docs/`](docs) folder for comprehensive documentation:

- **[Getting Started](docs/GETTING_STARTED.md)** - Installation and setup
- **[Admin Guide](docs/ADMIN_GUIDE.md)** - Using the admin panel
- **[Features](docs/FEATURES.md)** - Complete feature list
- **[Keyboard Shortcuts](docs/SHORTCUTS.md)** - All shortcuts
- **[API Reference](docs/API.md)** - Server API endpoints
- **[Architecture](docs/ARCHITECTURE.md)** - Technical overview
- **[Changelog](docs/CHANGELOG.md)** - Update history

## ✨ Key Features

- 📝 Markdown editor with live preview
- 🔐 Secure authentication system
- 📤 Export to Markdown, HTML, Text, PDF
- 🎨 Dark/Light theme toggle
- ⌨️ Keyboard shortcuts for productivity
- 📁 Drag & drop file upload
- 🎯 Distraction-free writing mode
- 📋 Multiple paper templates
- 🔍 Search and category filtering

## 🛠️ Tech Stack

- **Backend:** Node.js (native HTTP/HTTPS)
- **Frontend:** Vanilla JavaScript
- **Markdown:** marked.js + KaTeX
- **Storage:** File system (no database)
- **Security:** DOMPurify, HttpOnly cookies

## 📦 Project Structure

```
port/
├── server.js           # Node.js server
├── papers/             # Paper storage
├── public/             # Public site
│   ├── admin/         # Admin panel
│   ├── css/           # Stylesheets
│   └── js/            # JavaScript
├── docs/              # Documentation
└── ssl/               # SSL certificates (optional)
```

echo ADMIN_PASSWORD=your_secure_password > .env

````

### Start the Server

```bash
node server.js
````

The server will start on **http://localhost:3000**

**Default admin password:** `admin123` (change this in `.env` or `server.js`)

### Access Points

- **Public Site:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **API Endpoint:** http://localhost:3000/api/papers

### Stop the Server

Press `Ctrl + C` in the terminal.

---

## 📝 Managing Papers

### Adding a New Paper

1. **Create a markdown file** in the `papers/` folder:

   ```bash
   papers/your-paper-title.md
   ```

2. **Use this template:**

```markdown
# Paper Title Here

_Author Name • Published YEAR_

Brief abstract or description...

## Introduction

Content here...

## Method

### Participants

Description...

### Procedure

Steps...

## Results

You can use inline math: $M = 25.3$, $SD = 4.2$

Display equations:
$$r = .45, p < .001$$

## Discussion

Discussion content...

## Conclusion

Final thoughts...

**Reference:**
Author, A. A. (Year). Title of article. _Journal Name_, Vol(Issue), pages. https://doi.org/xxxxx

[Read Full Article](https://doi.org/xxxxx)
```

3. **Optional: Add hashtag keywords** at the very top:

   ```markdown
   #burnout #mental-health #workplace

   # Paper Title Here
   ```

4. **No restart needed** - papers load dynamically via API

### Using the Admin Panel

1. Navigate to **http://localhost:3000/admin**
2. Login with your admin password
3. Features:
   - Create new papers
   - Edit existing papers with live preview
   - Delete papers
   - Autosave (2-second debounce)
   - Markdown and math syntax highlighting

### Editing Papers Manually

Simply edit the `.md` files in the `papers/` folder and refresh the browser. The server reads files on-demand.

### Deleting Papers

- **Via Admin Panel:** Select paper and click Delete
- **Manually:** Delete the `.md` file from `papers/` folder

---

## 🏷️ Category System

Papers are automatically categorized based on **filename keywords**.

### Available Categories

Edit `CATEGORY_MAP` in [`public/js/main.js`](public/js/main.js) (around line 145):

| Category      | Filename Keywords                          | Icon             |
| ------------- | ------------------------------------------ | ---------------- |
| Clinical      | anxiety, depression, psychotherapy, trauma | `fa-user-md`     |
| Cognitive     | cognition, memory                          | `fa-brain`       |
| Social        | social, attachment                         | `fa-users`       |
| Health        | burnout, sleep, addiction                  | `fa-heartbeat`   |
| Developmental | developmental                              | `fa-child`       |
| Neuroscience  | neuroscience                               | `fa-dna`         |
| Personality   | personality, motivation                    | `fa-fingerprint` |
| Other         | _(no match)_                               | `fa-file-alt`    |

### Examples

- `burnout-teachers.md` → **Health** (contains "burnout")
- `social-anxiety.md` → **Clinical** (matches "anxiety" first)
- `random-notes.md` → **Other** (no keywords match)

### Adding New Categories

```javascript
const CATEGORY_MAP = {
  // Existing categories...

  // Add new category:
  methods: {
    icon: "fa-flask", // Font Awesome icon class
    label: "Research Methods", // Display name
    files: ["statistics", "qualitative", "methodology"], // Filename keywords
  },
};
```

---

## 🔐 Authentication & Security

### Setting Admin Password

**Option 1: Environment Variable (Recommended)**

```bash
# Create .env file
echo ADMIN_PASSWORD=your_secure_password > .env
```

**Option 2: Direct in server.js**

```javascript
const ADMIN_PASSWORD = "your_secure_password";
```

### Security Features

- **Session-based authentication** with HttpOnly cookies
- **Rate limiting:** 5 failed attempts → 15-minute lockout per IP
- **Password hashing** with SHA-256 and random salt
- **Session expiration:** 24 hours
- **CORS restrictions:** localhost only
- **Protected endpoints:** Only GET `/api/papers` is public; POST/PUT/DELETE require authentication
- **Path traversal protection** via `path.basename()`
- **Security headers:** X-Content-Type-Options, X-Frame-Options, X-XSS-Protection

### API Endpoints

| Method | Endpoint                | Auth Required | Description                   |
| ------ | ----------------------- | ------------- | ----------------------------- |
| GET    | `/api/papers`           | No            | List all papers with metadata |
| GET    | `/api/papers/:filename` | No            | Get paper content             |
| POST   | `/api/papers/save`      | Yes           | Create/update paper           |
| POST   | `/api/papers/delete`    | Yes           | Delete paper                  |
| POST   | `/api/auth/login`       | No            | Authenticate with password    |
| POST   | `/api/auth/logout`      | No            | Clear session                 |
| GET    | `/api/auth/check`       | No            | Check authentication status   |

---

## 🎨 Customization

### Changing Colors

Edit CSS variables in [`public/css/main.css`](public/css/main.css):

```css
:root {
  /* Dark Mode Colors */
  --bg-body: #1a1a1b; /* Page background */
  --bg-card: #1f1f20; /* Card backgrounds */
  --text-main: #e5e5e5; /* Main text */
  --text-muted: #888; /* Secondary text */
  --accent: #b74b4b; /* Accent color */
  --accent-hover: #c55555; /* Hover state */
  --line: #333; /* Borders/dividers */
}

[data-theme="light"] {
  /* Light Mode - override variables */
  --bg-body: #f5f5f5;
  --bg-card: #ffffff;
  --text-main: #1a1a1b;
  --text-muted: #666;
  --accent: #b74b4b;
  --line: #ddd;
}
```

### Changing Fonts

1. **Update font imports** in `public/index.html` and `public/paper.html`:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Your+Font:wght@400;600&display=swap"
  rel="stylesheet"
/>
```

2. **Update CSS variables:**

```css
:root {
  --font-sans: "Your Sans Font", system-ui, sans-serif;
  --font-serif: "Your Serif Font", Georgia, serif;
  --font-mono: "Your Mono Font", monospace;
}
```

### Personalizing Content

**In `public/index.html`:**

- Update name, title, bio in intro section
- Replace email address in contact section
- Update social media links (GitHub, LinkedIn, Twitter, ORCID)
- Modify timeline events
- Update technical skills in tech grid
- Change location and timezone

**Site-wide Settings:**

- **Favicon:** Edit inline SVG in `<link rel="icon">` tag
- **Meta tags:** Update `<title>`, `<meta name="description">`, OpenGraph tags
- **Analytics:** Add tracking scripts before `</body>` tag

---

## ⚙️ Configuration

### Frontend Settings

Edit in [`public/js/main.js`](public/js/main.js):

```javascript
// Initial papers shown on homepage (before "View More")
const ITEMS_INITIAL = 4;

// Papers per page after full view/pagination
const ITEMS_PER_PAGE = 10;

// Days a paper is marked as "New" (recent badge)
const RECENT_DAYS = 7;
```

### Server Configuration

Edit in [`server.js`](server.js):

```javascript
// Server port
const PORT = process.env.PORT || 3000;

// Papers directory
const PAPERS_DIR = path.join(__dirname, "papers");

// Session duration (milliseconds)
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting
const MAX_ATTEMPTS = 5; // Failed login attempts
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
```

---

## 📱 Features

| Feature                | How to Use                                   |
| ---------------------- | -------------------------------------------- |
| **Search Papers**      | Type in search box or press `/` key          |
| **Filter by Category** | Click category buttons above paper grid      |
| **Dark/Light Mode**    | Click theme toggle in side panel             |
| **View Paper**         | Click paper title or "Read More" link        |
| **Copy Email**         | Click copy icon next to email address        |
| **Back to Top**        | Scroll down, click floating arrow button     |
| **Timeline Scroll**    | Click and drag timeline (mouse/touch)        |
| **Admin Panel**        | Navigate to `/admin`, login with password    |
| **Create Paper**       | Admin panel → "New Paper" button             |
| **Edit Paper**         | Admin panel → Select paper from dropdown     |
| **Delete Paper**       | Admin panel → "Delete" button (with confirm) |

### Keyboard Shortcuts

- `Esc` — Close side panel
- `/` — Focus search input
- `←` / `→` — Navigate pagination (when available)

---

## 🌐 Deployment

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and import repository
3. Vercel auto-detects Node.js setup
4. Add environment variable: `ADMIN_PASSWORD=your_password`
5. Deploy!

### Option 2: Render

1. Push code to GitHub
2. Create new Web Service on [render.com](https://render.com)
3. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variable:** `ADMIN_PASSWORD=your_password`
4. Deploy!

### Option 3: Railway

1. Push to GitHub
2. Import project on [railway.app](https://railway.app)
3. Add environment variable `ADMIN_PASSWORD`
4. Railway auto-detects Node.js

### Option 4: Self-Hosted (VPS/Server)

```bash
# Install PM2 for process management
npm install -g pm2

# Start server (runs in background)
pm2 start server.js --name portfolio

# Auto-restart on system reboot
pm2 startup
pm2 save

# View logs
pm2 logs portfolio

# Restart after changes
pm2 restart portfolio

# Stop server
pm2 stop portfolio
```

### Environment Variables for Production

```bash
# .env file
ADMIN_PASSWORD=your_very_secure_password_here
PORT=3000
NODE_ENV=production
```

**⚠️ Important:** Never commit `.env` file to git (it's in `.gitignore` by default).

---

## 🐛 Troubleshooting

### Server Issues

**"Could not load papers" error**

- ✅ Ensure server is running: `node server.js`
- ✅ Check terminal for error messages
- ✅ Verify `papers/` folder exists with `.md` files
- ✅ Check you're accessing `http://localhost:3000` (not opening HTML file directly)

**Port already in use**

```bash
# Change port in server.js or use environment variable
PORT=3001 node server.js
```

**Server crashes immediately**

- Check for syntax errors in `server.js`
- Ensure `papers/` directory exists
- Check file permissions

### Frontend Issues

**Papers not showing category**

- Check filename contains keyword from `CATEGORY_MAP`
- Keywords are case-insensitive

**Styles look broken**

- Hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- Check browser console (F12) for errors
- Verify [`public/css/main.css`](public/css/main.css) exists

**Math equations not rendering**

- KaTeX loads from CDN (requires internet)
- Use `$...$` for inline math, `$$...$$` for display equations
- Check browser console for KaTeX errors

**Search not working**

- Papers must be loaded first (wait for skeleton loader to disappear)
- Check browser console (F12) for JavaScript errors

**Changes not appearing**

- Restart server after editing server-side files (`server.js`)
- Hard refresh browser after editing frontend files: `Ctrl + Shift + R`
- Check browser cache is not disabled in DevTools

### Admin Panel Issues

**Can't login**

- Verify password matches `ADMIN_PASSWORD` in `.env` or `server.js`
- Check for rate limiting (5 failed attempts = 15min lockout)
- Clear cookies and try again

**"Unauthorized" when saving**

- Session may have expired (24 hours)
- Re-login to admin panel
- Check browser cookies are enabled

**Papers not saving**

- Check filename has `.md` extension
- Verify server has write permissions to `papers/` folder
- Check browser console and server terminal for errors

### Common Mistakes

❌ **Opening HTML file directly:** `file:///C:/path/to/public/index.html`

- ✅ **Use server:** `http://localhost:3000`

❌ **Using `/papers/file.md` instead of `/api/papers/file.md`**

- ✅ All API calls must go through `/api/` prefix

❌ **Forgetting `.md` extension** when creating papers

- ✅ All paper files must end with `.md`

---

## 📋 Development Checklist

### Initial Setup

```
✅ Install Node.js
✅ Run `npm install`
✅ Create `.env` with ADMIN_PASSWORD
✅ Add at least one paper in `papers/` folder
✅ Start server: `node server.js`
✅ Access http://localhost:3000
✅ Test admin login at http://localhost:3000/admin
```

### Customization

```
✅ Update personal info in public/index.html (name, email, bio)
✅ Update social links (GitHub, LinkedIn, ORCID, Twitter)
✅ Modify timeline events in index.html
✅ Update technical skills section
✅ Change colors in public/css/main.css
✅ Add/modify categories in public/js/main.js
✅ Customize favicon (emoji or image)
```

### Before Deployment

```
✅ Set strong ADMIN_PASSWORD in environment
✅ Test all papers load correctly
✅ Test admin panel create/edit/delete
✅ Verify search and filtering work
✅ Test on mobile viewport
✅ Check dark/light theme switching
✅ Remove `.github/` folder if not using Copilot
✅ Update README with your specifics
```

---

## 🔧 Tech Stack

- **Server:** Node.js HTTP module (no Express)
- **Frontend:** Vanilla JavaScript (no frameworks)
- **Styling:** CSS with custom properties (variables)
- **Markdown:** marked.js + KaTeX for math rendering
- **Security:** DOMPurify for XSS protection
- **Icons:** Font Awesome 6
- **Fonts:** Google Fonts (Inter + Lora)

### Dependencies

```json
{
  "dotenv": "^16.3.1" // Only production dependency
}
```

---

## 📖 Additional Resources

- [Markdown Guide](https://www.markdownguide.org/)
- [KaTeX Supported Functions](https://katex.org/docs/supported.html)
- [Font Awesome Icons](https://fontawesome.com/icons)
- [Node.js HTTP Module Docs](https://nodejs.org/api/http.html)

---

## 📄 License

This project is open source. Feel free to use it for your own portfolio.

---

## 📅 Version

**Last Updated:** January 2026
**Node.js Version:** 14+

---

_Built with ☕ and academic dedication_
