# Psychology Portfolio - Documentation

A dynamic academic portfolio website for showcasing research papers, built with vanilla JavaScript, Node.js, and Markdown.

---

## 📁 Project Structure

```
port/
├── index.html          # Main portfolio page
├── paper.html          # Individual paper view page
├── style.css           # All styles (dark/light themes)
├── script.js           # Frontend JavaScript
├── server.js           # Node.js server (required to run)
├── README.md           # This documentation
└── papers/             # Markdown files for papers
    ├── burnout.md
    ├── anxiety.md
    ├── depression.md
    └── ... (add more .md files here)
```

---

## 🚀 How to Run

### Prerequisites

- [Node.js](https://nodejs.org/) installed (any recent version)

### Start the Server

```bash
cd d:\Psychology\Paper Drafts\Resume\port
node server.js
```

Then open: **http://localhost:3000**

### Stop the Server

Press `Ctrl + C` in the terminal.

---

## 📝 Adding New Papers

### Step 1: Create a Markdown File

Create a new `.md` file in the `papers/` folder:

```
papers/your-new-paper.md
```

### Step 2: Use This Template

```markdown
# Paper Title Here

_Author Name — Month Year_

## Abstract

Your abstract text here...

## Introduction

Introduction content...

## Method

### Participants

...

### Procedure

...

## Results

You can use math: $M = 25.3$, $SD = 4.2$

Display equations:
$$r = .45, p < .001$$

## Discussion

Discussion content...

## Conclusion

Conclusion content...

**Reference:**
Author, A. A. (Year). Title of article. _Journal Name_, Volume(Issue), pages. https://doi.org/xxxxx

[Read Full Article](https://doi.org/xxxxx)
```

### Step 3: Add Keywords (Optional)

Add hashtags at the TOP of your markdown file for tags on paper.html:

```markdown
#burnout #mental-health #workplace

# Paper Title Here

...
```

### Step 4: Restart Server

The paper will automatically appear. No code changes needed!

---

## 🏷️ Category System

Papers are auto-categorized based on **filename keywords**.

### Current Categories (in `script.js`):

| Category      | Keywords in Filename                       | Icon |
| ------------- | ------------------------------------------ | ---- |
| Clinical      | anxiety, depression, psychotherapy, trauma | 👨‍⚕️   |
| Cognitive     | cognition, memory                          | 🧠   |
| Social        | social, attachment                         | 👥   |
| Health        | burnout, sleep, addiction                  | ❤️   |
| Developmental | developmental                              | 👶   |
| Neuroscience  | neuroscience                               | 🧬   |
| Personality   | personality, motivation                    | 🔍   |
| Other         | (no match)                                 | 📄   |

### Examples:

- `burnout-teachers.md` → **Health** (contains "burnout")
- `social-anxiety.md` → **Clinical** (contains "anxiety", matched first)
- `random-notes.md` → **Other** (no keywords match)

### Modify Categories

Edit `CATEGORY_MAP` in `script.js` (around line 145):

```javascript
const CATEGORY_MAP = {
  clinical: {
    icon: "fa-user-md", // Font Awesome icon
    label: "Clinical", // Display name
    files: ["anxiety", "depression", "psychotherapy", "trauma"],
  },
  // Add new category:
  methods: {
    icon: "fa-flask",
    label: "Research Methods",
    files: ["statistics", "qualitative", "methodology"],
  },
};
```

---

## 🎨 Customization

### Change Colors

Edit CSS variables at the top of `style.css`:

```css
:root {
  /* Dark Mode */
  --bg-body: #1c1b1a; /* Page background */
  --bg-card: #252422; /* Card backgrounds */
  --text-main: #e8e4df; /* Main text color */
  --accent: #c9785d; /* Accent color (terracotta) */
  --accent-hover: #e08b6d; /* Accent hover state */
}

[data-theme="light"] {
  /* Light Mode - same variables, different values */
  --bg-body: #f5f1eb;
  --accent: #b85a3c;
  /* ... */
}
```

### Change Fonts

Update font imports in `index.html` and `paper.html`:

```html
<link
  href="https://fonts.googleapis.com/css2?family=YOUR-FONT&display=swap"
  rel="stylesheet"
/>
```

Then update CSS:

```css
:root {
  --font-serif: "Your Serif Font", Georgia, serif;
  --font-sans: "Your Sans Font", sans-serif;
}
```

### Disable Paper Grain Texture

In `style.css`, set grain opacity to 0:

```css
:root {
  --grain-opacity: 0;
}
```

---

## ⚙️ Configuration Options

### In `script.js`:

```javascript
// How many papers show initially on homepage
const ITEMS_INITIAL = 4;

// Papers per page after clicking "View More"
const ITEMS_PER_PAGE = 10;

// Days a paper is considered "new" (shows badge)
const RECENT_DAYS = 7;
```

### Server Port

In `server.js`, change the port:

```javascript
const PORT = 3000; // Change to any port
```

---

## 📱 Features Reference

| Feature                | How to Use                                                   |
| ---------------------- | ------------------------------------------------------------ |
| **Search**             | Type in search box, or press `/` key                         |
| **Filter by Category** | Click filter buttons above papers                            |
| **Dark/Light Mode**    | Click theme toggle in side menu                              |
| **Keyboard Shortcuts** | `Esc` = close menu, `/` = focus search, `←`/`→` = pagination |
| **Copy Citation**      | On paper page, click "Cite" button                           |
| **Share Paper**        | On paper page, click "Share" button                          |
| **Print Paper**        | On paper page, click "Print" button                          |
| **Back to Top**        | Scroll down, click arrow button                              |
| **Timeline Scroll**    | Click and drag the timeline                                  |

---

## 🔗 Update Your Links

In `index.html`, replace these placeholder URLs:

```html
<!-- GitHub -->
<a href="https://github.com/YOUR-USERNAME">
  <!-- LinkedIn -->
  <a href="https://linkedin.com/in/YOUR-USERNAME">
    <!-- Twitter -->
    <a href="https://twitter.com/YOUR-USERNAME">
      <!-- ORCID -->
      <a href="https://orcid.org/YOUR-ORCID-ID">
        <!-- Email (in two places) -->
        <span class="email-text">your.actual@email.com</span></a
      ></a
    ></a
  ></a
>
```

---

## 🌐 Deployment Options

### Option 1: GitHub Pages (Free, Static Only)

⚠️ Won't work as-is (needs server). Would need to convert to static site.

### Option 2: Vercel (Recommended, Free)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. It auto-detects Node.js and deploys

### Option 3: Render (Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new "Web Service"
4. Connect repo, set start command: `node server.js`

### Option 4: Railway (Free tier)

Similar to Render, easy Node.js deployment.

### Option 5: Run on Your Own Server

```bash
# Install PM2 for process management
npm install -g pm2

# Start server (keeps running after terminal closes)
pm2 start server.js --name portfolio

# View logs
pm2 logs portfolio

# Stop
pm2 stop portfolio
```

---

## 🐛 Troubleshooting

### "Could not load papers" error

- Make sure server is running: `node server.js`
- Check terminal for errors
- Verify `papers/` folder exists with `.md` files

### Papers not showing category

- Check filename contains a keyword from `CATEGORY_MAP`
- Keywords are case-insensitive

### Styles look broken

- Clear browser cache: `Ctrl + Shift + R`
- Check `style.css` is in the same folder

### Math equations not rendering

- KaTeX loads from CDN, needs internet
- Use `$...$` for inline, `$$...$$` for display math

### Changes not appearing

- Restart server after changing `.js` files
- Hard refresh browser: `Ctrl + Shift + R`

---

## 📋 File Checklist for New Setup

```
✅ index.html
✅ paper.html
✅ style.css
✅ script.js
✅ server.js
✅ papers/ folder with at least one .md file
✅ Updated personal info (email, social links)
✅ Updated timeline events
✅ Updated technical skills
```

---

## 🔧 Quick Reference Commands

```bash
# Navigate to project
cd d:\Psychology\Paper Drafts\Resume\port

# Start server
node server.js

# Server runs at
http://localhost:3000

# Stop server
Ctrl + C
```

---

## 📅 Last Updated

December 2024

## 👤 Author

Vishu

---

_If you forget something, just read this file! 🧠_
