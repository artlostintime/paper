# 🎛️ Admin Panel Guide

## Accessing Admin Panel

1. Navigate to `/admin` (`http://localhost:3000/admin`)
2. Enter your password (default: `admin123`)
3. Click **Login**

## Creating a New Paper

### Method 1: From Sidebar

1. Click **+ New Paper** button in sidebar
2. Enter filename (e.g., `my-paper.md`)
3. Start typing in the editor

### Method 2: From Template

1. Click **Templates** in toolbar
2. Select a template (Research Article, Notes, etc.)
3. Edit the pre-filled content
4. Click **Save** or press `Ctrl+S`

### Method 3: Drag & Drop

1. Drag a `.md` file from your file explorer
2. Drop it on the editor
3. Content loads automatically

## Editing Papers

1. Click a paper name in the sidebar
2. Edit in the left pane (Markdown)
3. See live preview in right pane
4. Changes auto-save after 2 seconds
5. Or manually save with `Ctrl+S`

## Using Templates

**Available Templates:**

- **Basic Paper** - Simple essay format
- **Research Article** - Abstract, Method, Results, Discussion
- **Literature Review** - Structured review format
- **Quick Notes** - Bullet points and summary
- **Clinical Case Study** - Patient background, assessment, treatment
- **Experiment Report** - Full experimental study format
- **Paper Summary** - Review existing papers

## Exporting Papers

1. Click **Export** in toolbar
2. Choose format:
   - **Markdown** - Original `.md` file
   - **HTML** - Formatted with styles
   - **Plain Text** - No formatting
   - **PDF (Print)** - Opens print dialog

## Customizing Your Workspace

### Theme

- Click 🌙 (moon) icon to switch to light theme
- Click ☀️ (sun) icon to switch to dark theme
- Or press `Ctrl+Shift+T`

### Font Size

- Click ➕ to increase font size (max 24px)
- Click ➖ to decrease font size (min 10px)
- Or use `Ctrl++` and `Ctrl+-`

### Distraction-Free Mode

- Click 🗗 (expand) icon or press `F11`
- Hides sidebar, toolbar, header
- Press `Esc` to exit

### Sidebar

- Click ☰ (hamburger) icon to toggle
- Or press `Ctrl+B` (when not in editor)

## Writing Tips

### Markdown Basics

```markdown
# Heading 1

## Heading 2

**bold** and _italic_
[Link](https://example.com)
![Image](image.jpg)

- List item
  > Blockquote
```

### Math Equations

```markdown
Inline: $E = mc^2$
Display: $$\int_0^\infty e^{-x^2} dx$$
```

### Quick Insert

Use the quick insert buttons above the editor:

- **# H1**, **## H2**, **### H3** - Headings
- **• List**, **1. Num** - Lists
- **🔗 Link**, **∑ Math** - Links and math
- **❝ Quote**, **— HR** - Quotes and dividers

## Keyboard Shortcuts

See [SHORTCUTS.md](SHORTCUTS.md) for the complete list.

**Most Used:**

- `Ctrl+S` - Save
- `Ctrl+B` - Bold
- `Ctrl+I` - Italic
- `Ctrl+F` - Find
- `F11` - Distraction-free

## Troubleshooting

### Paper not saving

- Check if filename ends with `.md`
- Look for red dot next to filename (unsaved indicator)
- Check browser console for errors

### Preview not updating

- Make sure you're typing in the left pane
- Preview updates live as you type
- Try refreshing if stuck

### Lost changes

- Admin panel warns before closing with unsaved changes
- Auto-saves every 2 seconds when typing stops
- Use `Ctrl+S` frequently

### Can't login

- Check password in `.env` file
- Default password is `admin123`
- After 5 failed attempts, wait 15 minutes

### Theme not persisting

- Make sure browser allows localStorage
- Try clearing browser cache
- Check browser console for errors
