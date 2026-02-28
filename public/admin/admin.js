// ============== ADMIN PANEL — VS Code Layout ==============

document.addEventListener("DOMContentLoaded", () => {
  console.log("Admin panel initializing...");

  // ============== DOM ELEMENTS ==============
  // Auth
  const loginScreen = document.getElementById("login-screen");
  const adminApp = document.getElementById("admin-app");
  const loginForm = document.getElementById("login-form");
  const loginPassword = document.getElementById("login-password");
  const loginError = document.getElementById("login-error");
  const togglePasswordBtn = document.getElementById("toggle-password");
  const logoutBtn = document.getElementById("logout-btn");

  // Side Panel / Explorer
  const sidePanel = document.getElementById("side-panel");
  const paperList = document.getElementById("paper-list");
  const paperCount = document.getElementById("paper-count");

  const newBtnSidebar = document.getElementById("new-btn-sidebar");
  const refreshBtn = document.getElementById("refresh-btn");
  const collapsePanelBtn = document.getElementById("collapse-panel-btn");
  const sidebarToggle = document.getElementById("sidebar-toggle");

  // Editor
  const filenameInput = document.getElementById("filename");
  const editor = document.getElementById("markdown-editor");
  const preview = document.getElementById("preview-content");
  const editorContent = document.getElementById("editor-content");
  const lineNumbers = document.getElementById("line-numbers");
  const tabFilename = document.getElementById("tab-filename");
  const tabUnsaved = document.getElementById("tab-unsaved");

  // Buttons & Controls
  const saveBtn = document.getElementById("save-btn");
  const exportBtn = document.getElementById("export-btn");
  const exportMenu = document.getElementById("export-menu");
  const insertBtn = document.getElementById("insert-btn");
  const insertMenu = document.getElementById("insert-menu");
  const yamlBtn = document.getElementById("yaml-btn");
  const themeToggle = document.getElementById("theme-toggle");
  const fontIncrease = document.getElementById("font-increase");
  const fontDecrease = document.getElementById("font-decrease");
  const fontSizeLabel = document.getElementById("font-size-label");
  const distractionFree = document.getElementById("distraction-free");
  const mobilePreviewToggle = document.getElementById("mobile-preview-toggle");

  // Modals
  const toast = document.getElementById("toast");
  const deleteModal = document.getElementById("delete-modal");
  const deleteFilename = document.getElementById("delete-filename");
  const shortcutsModal = document.getElementById("shortcuts-modal");
  const shortcutsBtn = document.getElementById("shortcuts-btn");
  const closeShortcuts = document.getElementById("close-shortcuts");
  const cancelDelete = document.getElementById("cancel-delete");
  const confirmDelete = document.getElementById("confirm-delete");

  // Command Palette
  const commandPalette = document.getElementById("command-palette");
  const commandInput = document.getElementById("command-palette-input");
  const commandList = document.getElementById("command-list");
  const commandPaletteBtn = document.getElementById("command-palette-btn");

  // Status bar
  const cursorPosition = document.getElementById("cursor-position");
  const autosaveIndicator = document.getElementById("autosave-indicator");

  // Resize handles
  const panelSash = document.getElementById("panel-sash");
  const editorSash = document.getElementById("editor-sash");

  // ============== STATE ==============
  let papers = [];
  let currentFile = null;
  let hasUnsavedChanges = false;
  let autosaveTimer = null;

  let editorFontSize = 14;
  let currentTheme = localStorage.getItem("adminTheme") || "dark";
  let mobilePreviewActive = false;
  let activePanel = "explorer";
  let commandSelectedIndex = 0;

  // ============== THEME ==============
  function initTheme() {
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    if (!themeToggle) return;
    const icon = themeToggle.querySelector("i");
    if (currentTheme === "dark") {
      icon.className = "fas fa-sun";
      themeToggle.title = "Switch to Light Theme";
    } else {
      icon.className = "fas fa-moon";
      themeToggle.title = "Switch to Dark Theme";
    }
  }

  function toggleTheme() {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("adminTheme", currentTheme);
    updateThemeIcon();
    showToast(`Switched to ${currentTheme} theme`, "success");
  }

  // ============== FONT SIZE ==============
  function updateFontSize() {
    if (editor) {
      editor.style.fontSize = `${editorFontSize}px`;
      localStorage.setItem("editorFontSize", editorFontSize);
    }
    // Sync syntax highlight overlay font size
    if (syntaxHighlight) {
      syntaxHighlight.style.fontSize = `${editorFontSize}px`;
    }
    if (fontSizeLabel) fontSizeLabel.textContent = `${editorFontSize}px`;
    updateLineNumbers();
  }

  function increaseFontSize() {
    if (editorFontSize < 24) {
      editorFontSize++;
      updateFontSize();
    }
  }

  function decreaseFontSize() {
    if (editorFontSize > 10) {
      editorFontSize--;
      updateFontSize();
    }
  }

  const savedFontSize = localStorage.getItem("editorFontSize");
  if (savedFontSize) editorFontSize = parseInt(savedFontSize);

  // ============== DISTRACTION FREE ==============
  function toggleDistractionFree() {
    adminApp.classList.toggle("distraction-free");
    const isActive = adminApp.classList.contains("distraction-free");
    if (distractionFree) {
      const icon = distractionFree.querySelector("i");
      icon.className = isActive ? "fas fa-compress" : "fas fa-expand";
    }
    // When entering zen mode, ensure editor-content is in split view by default
    if (isActive && editorContent) {
      editorContent.className = "editor-content";
      // Sync zen toolbar buttons
      document
        .querySelectorAll("[data-zen-view]")
        .forEach((b) => b.classList.remove("active"));
      const splitBtn = document.querySelector('[data-zen-view="split"]');
      if (splitBtn) splitBtn.classList.add("active");
    }
    showToast(isActive ? "Zen mode enabled" : "Zen mode disabled", "info");
  }

  // ============== AUTHENTICATION ==============
  function showLoginScreen() {
    if (loginScreen) {
      loginScreen.style.display = "flex";
    }
    if (adminApp) adminApp.style.display = "none";
    if (loginPassword) {
      loginPassword.value = "";
      setTimeout(() => loginPassword.focus(), 100);
    }
    if (loginError) loginError.textContent = "";
  }

  function showAdminPanel() {
    if (loginScreen) loginScreen.style.display = "none";
    if (adminApp) {
      adminApp.style.display = "flex";
    }
    loadPapers();
    updateLineNumbers();
  }

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/check", {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.authenticated === true) {
        showAdminPanel();
      } else {
        showLoginScreen();
      }
    } catch (e) {
      showLoginScreen();
    }
  }

  // Login form
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = loginPassword ? loginPassword.value : "";
      if (!password) {
        if (loginError) loginError.textContent = "Please enter a password";
        return;
      }
      if (loginError) loginError.textContent = "";
      const btn = loginForm.querySelector("button[type=submit]");
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      }
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (data.success) {
          showAdminPanel();
        } else {
          if (loginError)
            loginError.textContent = data.error || "Invalid password";
          if (loginPassword) loginPassword.select();
        }
      } catch (e) {
        if (loginError) loginError.textContent = "Connection error. Try again.";
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
      }
    });
  }

  // Toggle password
  if (togglePasswordBtn && loginPassword) {
    togglePasswordBtn.addEventListener("click", () => {
      const type = loginPassword.type === "password" ? "text" : "password";
      loginPassword.type = type;
      togglePasswordBtn.innerHTML = `<i class="fas fa-eye${type === "password" ? "" : "-slash"}"></i>`;
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (
        hasUnsavedChanges &&
        !confirm("You have unsaved changes. Logout anyway?")
      )
        return;
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
      } catch (e) {}
      showLoginScreen();
      showToast("Logged out", "success");
    });
  }

  // ============== PAPERS MANAGEMENT ==============
  let papersMetadata = {};

  async function loadPapers() {
    try {
      const res = await fetch("/api/papers", { credentials: "same-origin" });
      const data = await res.json();
      if (Array.isArray(data)) {
        papers = data;
        papersMetadata = {};
      } else if (Array.isArray(data.files)) {
        papers = data.files;
        papersMetadata = data.metadata || {};
      } else if (data.files && typeof data.files === "object") {
        papers = Object.keys(data.files);
        papersMetadata = data.metadata || {};
      } else if (typeof data === "object") {
        papers = Object.keys(data);
        papersMetadata = {};
      } else {
        papers = [];
        papersMetadata = {};
      }
      renderPaperList();
    } catch (e) {
      console.error("Load papers error:", e);
      showToast("Failed to load papers", "error");
    }
  }

  function formatRelativeTime(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function renderPaperList() {
    if (!paperList) return;
    const filtered = papers;

    if (paperCount) paperCount.textContent = papers.length;

    if (filtered.length === 0) {
      paperList.innerHTML = `
        <li class="tree-item" style="justify-content:center; padding:2rem; opacity:0.5; cursor:default;">
          <i class="fas fa-file-alt"></i> No papers yet
        </li>`;
      return;
    }

    paperList.innerHTML = filtered
      .map((filename) => {
        const meta = papersMetadata[filename];
        const timeStr = meta ? formatRelativeTime(meta.mtime) : "";
        return `
        <li class="tree-item ${currentFile === filename ? "active" : ""}" data-file="${filename}">
          <i class="fas fa-file-code"></i>
          <div class="tree-label-group">
            <span class="tree-label">${filename.replace(".md", "").replace(/-/g, " ")}</span>
            ${timeStr ? `<span class="tree-meta">${timeStr}</span>` : ""}
          </div>
          <span class="tree-actions">
            <button class="duplicate-btn" data-file="${filename}" title="Duplicate"><i class="fas fa-copy"></i></button>
            <button class="delete-btn" data-file="${filename}" title="Delete"><i class="fas fa-trash"></i></button>
          </span>
        </li>`;
      })
      .join("");

    // Click handlers
    paperList.querySelectorAll(".tree-item[data-file]").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (
          !e.target.closest(".delete-btn") &&
          !e.target.closest(".duplicate-btn")
        ) {
          loadPaper(item.dataset.file);
        }
      });
    });

    paperList.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        showDeleteModal(btn.dataset.file);
      });
    });

    paperList.querySelectorAll(".duplicate-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        duplicatePaper(btn.dataset.file);
      });
    });
  }

  async function loadPaper(filename) {
    if (hasUnsavedChanges && !confirm("You have unsaved changes. Continue?"))
      return;
    try {
      const res = await fetch(`/api/papers/${encodeURIComponent(filename)}`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const content = data.raw || data.content || "";

      currentFile = filename;
      if (filenameInput) filenameInput.value = filename;
      if (editor) editor.value = content;
      if (tabFilename) tabFilename.textContent = filename.replace(".md", "");
      updatePreview();
      updateWordCount();
      updateLineNumbers();
      updateSyntaxHighlight();
      setUnsaved(false);
      renderPaperList();
      showToast(`Loaded: ${filename}`, "info");
    } catch (e) {
      console.error("Load paper error:", e);
      showToast("Failed to load paper", "error");
    }
  }

  async function savePaper() {
    const filename = filenameInput ? filenameInput.value.trim() : "";
    const content = editor ? editor.value : "";
    if (!filename) {
      showToast("Please enter a filename", "error");
      if (filenameInput) filenameInput.focus();
      return;
    }
    const finalFilename = filename.endsWith(".md")
      ? filename
      : filename + ".md";
    if (filenameInput) filenameInput.value = finalFilename;
    if (tabFilename) tabFilename.textContent = finalFilename.replace(".md", "");

    updateAutosaveIndicator("saving");
    try {
      const res = await fetch("/api/papers/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ filename: finalFilename, content }),
      });
      if (!res.ok) throw new Error("Failed to save");
      currentFile = finalFilename;
      setUnsaved(false);
      updateAutosaveIndicator("saved");
      showToast("Saved!", "success");
      loadPapers();
    } catch (e) {
      console.error("Save error:", e);
      updateAutosaveIndicator("error");
      showToast("Failed to save", "error");
    }
  }

  async function duplicatePaper(filename) {
    try {
      const res = await fetch(`/api/papers/${encodeURIComponent(filename)}`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const content = data.raw || data.content || "";
      const newFilename = filename.replace(".md", "-copy.md");
      if (filenameInput) filenameInput.value = newFilename;
      if (editor) editor.value = content;
      if (tabFilename) tabFilename.textContent = newFilename.replace(".md", "");
      currentFile = null;
      updatePreview();
      updateWordCount();
      updateLineNumbers();
      updateSyntaxHighlight();
      setUnsaved(true);
      renderPaperList();
      showToast("Paper duplicated — save to keep!", "info");
    } catch (e) {
      showToast("Failed to duplicate", "error");
    }
  }

  async function deletePaper(filename) {
    try {
      const res = await fetch("/api/papers/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ filename }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      if (currentFile === filename) newPaper();
      showToast("Paper deleted", "success");
      loadPapers();
    } catch (e) {
      showToast("Failed to delete", "error");
    }
  }

  function newPaper() {
    if (hasUnsavedChanges && !confirm("You have unsaved changes. Continue?"))
      return;
    currentFile = null;
    if (filenameInput) filenameInput.value = "";
    if (editor) editor.value = "";
    if (tabFilename) tabFilename.textContent = "Untitled";
    if (preview) {
      preview.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-file-alt"></i>
          <h3>Live Preview</h3>
          <p>Start typing to see your formatted paper</p>
          <div class="shortcuts-hint">
            <kbd>Ctrl</kbd>+<kbd>S</kbd> Save &nbsp;
            <kbd>Ctrl</kbd>+<kbd>B</kbd> Bold &nbsp;
            <kbd>Ctrl</kbd>+<kbd>I</kbd> Italic
          </div>
        </div>`;
    }
    updateWordCount();
    updateLineNumbers();
    updateSyntaxHighlight();
    setUnsaved(false);
    updateAutosaveIndicator("ready");
    renderPaperList();
    if (filenameInput) filenameInput.focus();
  }

  // ============== PREVIEW ==============
  function updatePreview() {
    if (!preview || !editor) return;
    const content = editor.value;
    if (!content.trim()) {
      preview.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-file-alt"></i>
          <h3>Live Preview</h3>
          <p>Start typing to see your formatted paper</p>
        </div>`;
      return;
    }

    let cleanContent = content;
    if (content.trimStart().startsWith("---")) {
      // Match closing --- on its own line (not ---inside-text)
      const yamlClose = content.match(/\n---\s*\n/);
      if (yamlClose) {
        const endPos = yamlClose.index + yamlClose[0].length;
        cleanContent = content.substring(endPos).trim();
      }
    }
    cleanContent = cleanContent
      .replace(/^#[\w-]+(\s+#[\w-]+)*\s*$/gm, "")
      .trim();

    if (window.marked) {
      const rawHTML = marked.parse(cleanContent);
      preview.innerHTML = window.DOMPurify
        ? DOMPurify.sanitize(rawHTML)
        : rawHTML;
    } else {
      preview.innerHTML = window.DOMPurify
        ? DOMPurify.sanitize(cleanContent)
        : cleanContent;
    }

    if (window.renderMathInElement) {
      try {
        renderMathInElement(preview, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
          throwOnError: false,
        });
      } catch (e) {}
    }

    // Highlight code blocks in preview
    if (window.hljs) {
      preview.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }

  // ============== SYNTAX HIGHLIGHTING (editor overlay) ==============
  const syntaxHighlight = document.getElementById("syntax-highlight");
  const syntaxCode = syntaxHighlight
    ? syntaxHighlight.querySelector("code")
    : null;

  function highlightMarkdown(text) {
    if (!text) return "";

    // Placeholder system — protect regions from later regex passes
    const placeholders = [];
    function ph(str) {
      const idx = placeholders.length;
      placeholders.push(str);
      return `\x00PH${idx}\x00`;
    }
    function restorePH(str) {
      // Restore all placeholders (may be nested)
      let out = str;
      for (let i = placeholders.length - 1; i >= 0; i--) {
        out = out.replaceAll(`\x00PH${i}\x00`, placeholders[i]);
      }
      return out;
    }

    // Escape HTML first
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // --- Order matters: protect code / math first ---

    // Fenced code blocks → placeholder
    html = html.replace(
      /(^```)([\w-]*)(\n[\s\S]*?)(^```)/gm,
      (m, open, lang, body, close) =>
        ph(
          `<span class="md-code-block">${open}</span><span class="md-code-lang">${lang}</span><span class="md-code-block">${body}${close}</span>`,
        ),
    );

    // Inline code → placeholder
    html = html.replace(/(`[^`\n]+`)/g, (m) =>
      ph(`<span class="md-code-inline">${m}</span>`),
    );

    // Math blocks ($$...$$) → placeholder
    html = html.replace(/(\$\$[\s\S]*?\$\$)/g, (m) =>
      ph(`<span class="md-math">${m}</span>`),
    );

    // Inline math ($...$) → placeholder
    html = html.replace(/(\$[^$\n]+\$)/g, (m) =>
      ph(`<span class="md-math">${m}</span>`),
    );

    // Frontmatter
    html = html.replace(/^(---\n[\s\S]*?\n---)$/m, (m) =>
      ph(`<span class="md-frontmatter">${m}</span>`),
    );

    // Headings
    html = html.replace(
      /^(#{1,6}\s.+)$/gm,
      '<span class="md-heading">$1</span>',
    );

    // Bold + italic — single line only (***text*** or ___text___)
    html = html.replace(
      /(\*{3}|_{3})(?=\S)([^\n]*?\S)\1/g,
      '<span class="md-bold-italic">$1$2$1</span>',
    );

    // Bold — single line only (**text** or __text__)
    html = html.replace(
      /(\*{2}|_{2})(?=\S)([^\n]*?\S)\1/g,
      '<span class="md-bold">$1$2$1</span>',
    );

    // Italic — single line only (*text* or _text_)
    html = html.replace(
      /(\*|_)(?=\S)([^\n]*?\S)\1/g,
      '<span class="md-italic">$1$2$1</span>',
    );

    // Strikethrough — single line only
    html = html.replace(
      /~~([^\n]*?)~~/g,
      '<span class="md-strikethrough">~~$1~~</span>',
    );

    // Images ![alt](url)
    html = html.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<span class="md-image">![$1]($2)</span>',
    );

    // Links [text](url)
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '[<span class="md-link-text">$1</span>](<span class="md-link-url">$2</span>)',
    );

    // Blockquotes
    html = html.replace(
      /^(&gt;\s?.+)$/gm,
      '<span class="md-blockquote">$1</span>',
    );

    // Lists (unordered)
    html = html.replace(
      /^(\s*)([-*+])(\s)/gm,
      '$1<span class="md-list-marker">$2</span>$3',
    );

    // Lists (ordered)
    html = html.replace(
      /^(\s*)(\d+\.)(\s)/gm,
      '$1<span class="md-list-marker">$2</span>$3',
    );

    // HR
    html = html.replace(/^([-*_]{3,})$/gm, '<span class="md-hr">$1</span>');

    // HTML tags
    html = html.replace(
      /(&lt;\/?[\w-]+(?:\s[^&]*?)?&gt;)/g,
      '<span class="md-html-tag">$1</span>',
    );

    // Table separators
    html = html.replace(
      /^(\|[\s:]*[-:]+[\s:]*(?:\|[\s:]*[-:]+[\s:]*)*\|?)$/gm,
      '<span class="md-table-sep">$1</span>',
    );

    // Restore all placeholders
    html = restorePH(html);

    return html;
  }

  function updateSyntaxHighlight() {
    if (!syntaxCode || !editor) return;
    syntaxCode.innerHTML = highlightMarkdown(editor.value) + "\n";
  }

  // ============== FIND & REPLACE ==============
  const frWidget = document.getElementById("find-replace-widget");
  const frFindInput = document.getElementById("fr-find-input");
  const frReplaceInput = document.getElementById("fr-replace-input");
  const frCount = document.getElementById("fr-count");
  const frRegexBtn = document.getElementById("fr-regex-btn");
  const frCaseBtn = document.getElementById("fr-case-btn");
  const frExpandBtn = document.getElementById("fr-expand-btn");
  const frReplaceRow = document.getElementById("fr-replace-row");

  let frMatches = [];
  let frCurrent = -1;
  let frUseRegex = false;
  let frMatchCase = false;

  function openFindReplace(showReplace = false) {
    if (!frWidget) return;
    frWidget.classList.add("open");
    if (showReplace) frWidget.classList.add("show-replace");
    // Pre-fill with selection
    if (editor) {
      const sel = editor.value.substring(
        editor.selectionStart,
        editor.selectionEnd,
      );
      if (sel && !sel.includes("\n")) frFindInput.value = sel;
    }
    frFindInput.focus();
    frFindInput.select();
    frSearch();
  }

  function closeFindReplace() {
    if (!frWidget) return;
    frWidget.classList.remove("open", "show-replace");
    frMatches = [];
    frCurrent = -1;
    if (frCount) frCount.textContent = "0 results";
    if (editor) editor.focus();
  }

  function frSearch() {
    if (!frFindInput || !editor) return;
    const query = frFindInput.value;
    if (!query) {
      frMatches = [];
      frCurrent = -1;
      if (frCount) frCount.textContent = "0 results";
      return;
    }
    const text = editor.value;
    frMatches = [];
    try {
      let flags = "g" + (frMatchCase ? "" : "i");
      let re;
      if (frUseRegex) {
        re = new RegExp(query, flags);
      } else {
        re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
      }
      let m;
      while ((m = re.exec(text)) !== null) {
        frMatches.push({ start: m.index, end: m.index + m[0].length });
        if (m[0].length === 0) re.lastIndex++; // prevent infinite loop
      }
    } catch (e) {
      frMatches = [];
    }
    if (frMatches.length > 0) {
      // Jump to the nearest match from current cursor
      const cursor = editor.selectionStart;
      frCurrent = frMatches.findIndex((m) => m.start >= cursor);
      if (frCurrent === -1) frCurrent = 0;
      frHighlightMatch();
    } else {
      frCurrent = -1;
    }
    frUpdateCount();
  }

  function frUpdateCount() {
    if (!frCount) return;
    if (frMatches.length === 0) {
      frCount.textContent = frFindInput.value ? "No results" : "0 results";
    } else {
      frCount.textContent = `${frCurrent + 1} of ${frMatches.length}`;
    }
  }

  function frHighlightMatch() {
    if (frCurrent < 0 || frCurrent >= frMatches.length || !editor) return;
    const match = frMatches[frCurrent];
    editor.focus();
    editor.setSelectionRange(match.start, match.end);
    // Scroll into view — ensure cursor is visible
    const editorScroll = editor.closest(".editor-scroll");
    if (editorScroll) {
      const linesBefore = editor.value
        .substring(0, match.start)
        .split("\n").length;
      const lineH = parseFloat(getComputedStyle(editor).lineHeight) || 20;
      const targetY = (linesBefore - 1) * lineH;
      const viewTop = editorScroll.scrollTop;
      const viewBottom = viewTop + editorScroll.clientHeight;
      if (targetY < viewTop || targetY > viewBottom - lineH * 2) {
        editorScroll.scrollTop = targetY - editorScroll.clientHeight / 3;
      }
    }
  }

  function frNext() {
    if (frMatches.length === 0) return;
    frCurrent = (frCurrent + 1) % frMatches.length;
    frHighlightMatch();
    frUpdateCount();
  }

  function frPrev() {
    if (frMatches.length === 0) return;
    frCurrent = (frCurrent - 1 + frMatches.length) % frMatches.length;
    frHighlightMatch();
    frUpdateCount();
  }

  function frReplace() {
    if (frCurrent < 0 || frCurrent >= frMatches.length || !editor) return;
    const match = frMatches[frCurrent];
    const replaceWith = frReplaceInput ? frReplaceInput.value : "";
    editorReplaceRange(match.start, match.end, replaceWith);
    const newEnd = match.start + replaceWith.length;
    editor.setSelectionRange(newEnd, newEnd);
    updatePreview();
    updateSyntaxHighlight();
    updateLineNumbers();
    setUnsaved(true);
    frSearch(); // re-search to update matches
  }

  function frReplaceAll() {
    if (frMatches.length === 0 || !editor) return;
    const replaceWith = frReplaceInput ? frReplaceInput.value : "";
    const count = frMatches.length;
    // Replace from end to start to preserve indices and stack as one undo
    for (let i = frMatches.length - 1; i >= 0; i--) {
      const m = frMatches[i];
      editorReplaceRange(m.start, m.end, replaceWith);
    }
    updatePreview();
    updateSyntaxHighlight();
    updateLineNumbers();
    setUnsaved(true);
    frSearch();
    showToast(`Replaced ${count} occurrences`, "success");
  }

  // Wire up find-replace events
  if (frFindInput) {
    frFindInput.addEventListener("input", frSearch);
    frFindInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        frPrev();
      } else if (e.key === "Enter") {
        e.preventDefault();
        frNext();
      } else if (e.key === "Escape") {
        closeFindReplace();
      }
    });
  }
  if (frReplaceInput) {
    frReplaceInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        frReplace();
      } else if (e.key === "Escape") {
        closeFindReplace();
      }
    });
  }
  if (frRegexBtn)
    frRegexBtn.addEventListener("click", () => {
      frUseRegex = !frUseRegex;
      frRegexBtn.classList.toggle("active", frUseRegex);
      frSearch();
    });
  if (frCaseBtn)
    frCaseBtn.addEventListener("click", () => {
      frMatchCase = !frMatchCase;
      frCaseBtn.classList.toggle("active", frMatchCase);
      frSearch();
    });
  if (frExpandBtn)
    frExpandBtn.addEventListener("click", () => {
      frWidget.classList.toggle("show-replace");
    });
  const frCloseBtn = document.getElementById("fr-close-btn");
  if (frCloseBtn) frCloseBtn.addEventListener("click", closeFindReplace);
  const frNextBtn = document.getElementById("fr-next-btn");
  if (frNextBtn) frNextBtn.addEventListener("click", frNext);
  const frPrevBtn = document.getElementById("fr-prev-btn");
  if (frPrevBtn) frPrevBtn.addEventListener("click", frPrev);
  const frReplaceBtn = document.getElementById("fr-replace-btn");
  if (frReplaceBtn) frReplaceBtn.addEventListener("click", frReplace);
  const frReplaceAllBtn = document.getElementById("fr-replace-all-btn");
  if (frReplaceAllBtn) frReplaceAllBtn.addEventListener("click", frReplaceAll);

  // ============== LINE NUMBERS ==============
  let lastLineCount = 0;
  function updateLineNumbers() {
    if (!lineNumbers || !editor) return;
    const lines = editor.value.split("\n").length;
    if (lines === lastLineCount) return;
    lastLineCount = lines;
    const current = lineNumbers.children.length;
    if (lines > current) {
      const frag = document.createDocumentFragment();
      for (let i = current + 1; i <= lines; i++) {
        const div = document.createElement("div");
        div.textContent = i;
        frag.appendChild(div);
      }
      lineNumbers.appendChild(frag);
    } else if (lines < current) {
      while (lineNumbers.children.length > lines) {
        lineNumbers.removeChild(lineNumbers.lastChild);
      }
    }
    // Sync font size
    lineNumbers.style.fontSize = `${editorFontSize}px`;
  }

  // ============== CURSOR POSITION ==============
  function updateCursorPosition() {
    if (!cursorPosition || !editor) return;
    const text = editor.value.substring(0, editor.selectionStart);
    const lines = text.split("\n");
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;
    cursorPosition.textContent = `Ln ${ln}, Col ${col}`;
  }

  // ============== WORD COUNT ==============
  function updateWordCount() {
    const wcWords = document.getElementById("wc-words");
    const wcChars = document.getElementById("wc-chars");
    if (!wcWords || !wcChars || !editor) return;
    const text = editor.value.trim();
    const words = text
      ? text.split(/\s+/).filter((w) => w.length > 0).length
      : 0;
    wcWords.textContent = words;
    wcChars.textContent = text.length;
  }

  // ============== UNSAVED STATE ==============
  function setUnsaved(value) {
    hasUnsavedChanges = value;
    if (tabUnsaved) tabUnsaved.classList.toggle("visible", value);
    if (value && currentFile) {
      clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(() => {
        if (hasUnsavedChanges && currentFile) {
          updateAutosaveIndicator("saving");
          savePaper();
        }
      }, 3000);
    }
  }

  function updateAutosaveIndicator(status) {
    if (!autosaveIndicator) return;
    autosaveIndicator.className = "";
    autosaveIndicator.removeAttribute("class");
    autosaveIndicator.id = "autosave-indicator";
    switch (status) {
      case "saving":
        autosaveIndicator.classList.add("saving");
        autosaveIndicator.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> <span>Saving…</span>';
        break;
      case "saved":
        autosaveIndicator.classList.add("saved");
        autosaveIndicator.innerHTML =
          '<i class="fas fa-check"></i> <span>Saved</span>';
        break;
      case "error":
        autosaveIndicator.innerHTML =
          '<i class="fas fa-exclamation-triangle"></i> <span>Error</span>';
        break;
      default:
        autosaveIndicator.innerHTML =
          '<i class="fas fa-circle"></i> <span>Ready</span>';
    }
  }

  // ============== TEXT HELPERS ==============

  // Insert text via execCommand to preserve browser undo stack
  function editorInsertText(text) {
    editor.focus();
    document.execCommand("insertText", false, text);
  }

  // Replace the current selection range with text, preserving undo
  function editorReplaceRange(start, end, text) {
    editor.focus();
    editor.setSelectionRange(start, end);
    document.execCommand("insertText", false, text);
  }

  function insertAtCursor(text) {
    if (!editor) return;
    editor.focus();
    editorInsertText(text);
    updatePreview();
    updateWordCount();
    updateLineNumbers();
    updateSyntaxHighlight();
    setUnsaved(true);
  }

  function wrapSelection(before, after) {
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.substring(start, end);
    editor.focus();
    editor.setSelectionRange(start, end);
    editorInsertText(before + selected + after);
    // Re-select just the inner text
    editor.selectionStart = start + before.length;
    editor.selectionEnd = start + before.length + selected.length;
    updatePreview();
    updateWordCount();
    updateLineNumbers();
    updateSyntaxHighlight();
    setUnsaved(true);
  }

  function insertYAML() {
    if (!editor) return;
    const content = editor.value.trim();
    if (content.startsWith("---")) {
      showToast("YAML frontmatter already exists!", "warning");
      return;
    }
    const yamlTemplate = `---
title: "${filenameInput?.value.replace(".md", "") || "Paper Title"}"
author: "Your Name"
date: "${new Date().toISOString().split("T")[0]}"
category: "general"
tags: ["research", "psychology"]
description: "Brief paper description"
published: true
---

`;
    editorReplaceRange(0, 0, yamlTemplate);
    editor.setSelectionRange(0, 0);
    updatePreview();
    updateWordCount();
    updateLineNumbers();
    updateSyntaxHighlight();
    setUnsaved(true);
    showToast("YAML frontmatter added!", "success");
  }

  // ============== TOAST ==============
  function showToast(message, type = "success") {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove("show"), 2500);
  }

  function showDeleteModal(filename) {
    if (!deleteModal || !deleteFilename) return;
    deleteFilename.textContent = filename;
    deleteModal.classList.add("active");
    deleteModal.dataset.file = filename;
  }

  // ============== TEMPLATES ==============
  const templates = {
    basic: `---
title: "Paper Title"
author: "Your Name"
date: "${new Date().toISOString().split("T")[0]}"
category: "general"
tags: ["research", "psychology"]
description: "Brief paper description for SEO"
published: true
---

# Paper Title

*Your Name — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}*

## Abstract

Brief summary of your paper...

## Introduction

Introduction content here...

## Main Content

Your main content...

## Conclusion

Concluding thoughts...

---

**References:**

Author, A. A. (Year). Title. *Journal*, Volume(Issue), pages.`,

    research: `---
title: "Research Paper Title"
author: "Your Name"
date: "${new Date().toISOString().split("T")[0]}"
category: "research"
tags: ["clinical", "research", "methodology"]
description: "Research study investigating..."
published: true
---

# Research Paper Title

*Your Name — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}*

## Abstract

A concise summary of the research objectives, methodology, key findings, and conclusions.

## Introduction

Background information and context. State the research question or hypothesis.

## Method

### Participants
Description of participants (N = X, demographics).

### Procedure
Step-by-step description of the research process.

## Results

Present findings with statistics:
- Mean: $M = 0.00$, $SD = 0.00$
- Correlation: $r = .00$, $p < .05$

## Discussion

Interpretation of results, implications, limitations.

## Conclusion

Summary of key findings.

---

**References:**

Author, A. A. (Year). Title. *Journal*, Volume(Issue), pages.`,

    literature: `---
title: "Literature Review: Topic"
author: "Your Name"
date: "${new Date().toISOString().split("T")[0]}"
category: "literature"
tags: ["literature-review", "research"]
description: "Review of literature on..."
published: true
---

# Literature Review: [Topic]

*Your Name — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}*

## Introduction

Overview of the topic and scope of the review.

## Theoretical Framework

Key theories and models relevant to the topic.

## Thematic Analysis

### Theme 1
Summary of findings across studies...

### Theme 2
Summary of findings across studies...

## Gaps in the Literature

Areas requiring further research.

## Conclusion

Summary and future directions.

---

**References:**

Author, A. A. (Year). Title. *Journal*, Volume(Issue), pages.`,

    notes: `---
title: "Quick Notes: Topic Name"
author: "Your Name"
date: "${new Date().toISOString().split("T")[0]}"
category: "notes"
tags: ["notes", "quick-reference"]
description: "Quick notes on..."
published: false
---

# Quick Notes: Topic Name

*${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}*

## Key Points

- Point 1
- Point 2
- Point 3

## Summary

Brief summary here...

## References

- Source 1
- Source 2`,

    clinical: `---
title: "Clinical Case Study: Patient Condition"
author: "Your Name"
date: "${new Date().toISOString().split("T")[0]}"
category: "clinical"
tags: ["clinical", "case-study", "assessment"]
description: "Clinical case study of..."
published: true
---

# Clinical Case Study: [Patient/Condition]

*${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}*

## Patient Background

Age, gender, presenting concerns, relevant history.

## Assessment

### Clinical Interview
Key findings from interview...

### Diagnostic Criteria
DSM-5/ICD-11 criteria met...

## Diagnosis

Primary diagnosis with justification.

## Treatment Plan

1. Therapeutic approach
2. Intervention strategies
3. Expected outcomes

## Progress & Follow-up

Tracking of treatment progress...

---

**References:**

APA. (2013). *Diagnostic and Statistical Manual of Mental Disorders* (5th ed.).`,

    experiment: `---
title: "Experimental Study: Research Title"
author: "Your Name"
date: "${new Date().toISOString().split("T")[0]}"
category: "research"
tags: ["experimental", "research", "methodology"]
description: "Experimental study examining..."
published: true
---

# Experimental Study: [Title]

*${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}*

## Abstract

Brief overview of the experiment, hypothesis, method, results, and conclusion.

## Introduction

Background literature and theoretical framework. State the hypothesis:

**Hypothesis:** We predict that...

## Method

### Participants
- Sample size: N = 
- Demographics:
- Recruitment:

### Materials
Describe instruments, questionnaires, equipment...

### Design
- Independent variable(s):
- Dependent variable(s):
- Control variables:

### Procedure
1. Step-by-step protocol
2. Data collection process
3. Ethical considerations

## Results

### Descriptive Statistics
- Mean: $M = 0.00$, $SD = 0.00$
- Range: [min, max]

### Inferential Statistics
- Test used: t-test / ANOVA / etc.
- Results: $t(df) = 0.00$, $p < .05$
- Effect size: $d = 0.00$

## Discussion

Interpretation of findings, comparison with literature, limitations.

## Conclusion

Key takeaways and future directions.

---

**References:**

Author, A. A. (Year). Title. *Journal*, Volume(Issue), pages.`,

    summary: `---
title: "Paper Summary: Original Title"
author: "Your Name"
date: "${new Date().toISOString().split("T")[0]}"
category: "literature"
tags: ["summary", "literature-review", "critique"]
original_authors: "Author et al. (Year)"
description: "Summary and critique of..."
published: true
---

# Paper Summary: [Original Title]

**Original Authors:** Author et al. (Year)

**Summarized by:** Your Name — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}

---

## Overview

Brief description of the paper's main focus.

## Research Question

What question were the authors trying to answer?

## Methodology

- **Design:** Experimental/Survey/Meta-analysis/etc.
- **Sample:** Description of participants
- **Measures:** Key variables and instruments

## Key Findings

1. Finding 1
2. Finding 2
3. Finding 3

## Strengths

- Strength 1
- Strength 2

## Limitations

- Limitation 1
- Limitation 2

## Implications

What does this mean for theory/practice/future research?

## Personal Notes

Your thoughts, critiques, or connections to other work...

---

**Full Citation:**

Author, A. A., & Author, B. B. (Year). Title of article. *Journal Name*, Volume(Issue), pages. DOI`,

    empty: ``,
  };

  const insertSnippets = {
    heading: "## Heading\n\n",
    link: "[Link Text](https://example.com)",
    image: "![Alt Text](image-url.jpg)",
    list: "- Item 1\n- Item 2\n- Item 3\n",
    quote: "> Blockquote text here\n",
    math: "$$\nE = mc^2\n$$\n",
    table:
      "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n",
  };

  // ============== ACTIVITY BAR ==============
  document.querySelectorAll(".activity-btn[data-panel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.dataset.panel;
      // If clicking the already-active panel, toggle side panel
      if (panel === activePanel && !sidePanel.classList.contains("collapsed")) {
        sidePanel.classList.add("collapsed");
        btn.classList.remove("active");
        return;
      }
      // Activate panel
      activePanel = panel;
      sidePanel.classList.remove("collapsed");
      // Update activity bar active state
      document
        .querySelectorAll(".activity-btn[data-panel]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      // Switch panel view
      document
        .querySelectorAll(".panel-view")
        .forEach((v) => v.classList.remove("active"));
      const view = document.getElementById(`panel-${panel}`);
      if (view) view.classList.add("active");
      // Panel-specific focus
      // (search panel was removed — command palette handles search)
    });
  });

  // ============== SIDE PANEL COLLAPSE ==============
  function toggleSidePanel() {
    sidePanel.classList.toggle("collapsed");
    const isCollapsed = sidePanel.classList.contains("collapsed");
    // Update active button
    if (isCollapsed) {
      document
        .querySelectorAll(".activity-btn[data-panel]")
        .forEach((b) => b.classList.remove("active"));
    } else {
      const activeBtn = document.querySelector(
        `.activity-btn[data-panel="${activePanel}"]`,
      );
      if (activeBtn) activeBtn.classList.add("active");
    }
    try {
      localStorage.setItem("sidePanelCollapsed", isCollapsed);
    } catch (e) {}
  }

  if (sidebarToggle) sidebarToggle.addEventListener("click", toggleSidePanel);
  if (collapsePanelBtn)
    collapsePanelBtn.addEventListener("click", toggleSidePanel);

  // Restore side panel state
  try {
    if (localStorage.getItem("sidePanelCollapsed") === "true") {
      sidePanel.classList.add("collapsed");
      document
        .querySelectorAll(".activity-btn[data-panel]")
        .forEach((b) => b.classList.remove("active"));
    }
  } catch (e) {}

  // ============== COMMAND PALETTE ==============
  function openCommandPalette() {
    if (!commandPalette) return;
    commandPalette.classList.add("active");
    if (commandInput) {
      commandInput.value = "";
      commandInput.focus();
    }
    commandSelectedIndex = 0;
    renderCommandList("");
  }

  function closeCommandPalette() {
    if (commandPalette) commandPalette.classList.remove("active");
  }

  function renderCommandList(query) {
    if (!commandList) return;
    const q = query.toLowerCase().trim();
    let items = [];

    // Always show papers
    papers.forEach((f) => {
      const name = f.replace(".md", "").replace(/-/g, " ");
      if (!q || name.toLowerCase().includes(q) || f.toLowerCase().includes(q)) {
        items.push({
          label: name,
          hint: f,
          icon: "fa-file-code",
          action: () => loadPaper(f),
        });
      }
    });

    // Commands
    const commands = [
      { label: "New Paper", hint: "Ctrl+N", icon: "fa-plus", action: newPaper },
      { label: "Save", hint: "Ctrl+S", icon: "fa-save", action: savePaper },
      {
        label: "Toggle Theme",
        hint: "Ctrl+Shift+T",
        icon: "fa-moon",
        action: toggleTheme,
      },
      {
        label: "Zen Mode",
        hint: "F11",
        icon: "fa-expand",
        action: toggleDistractionFree,
      },
      {
        label: "Toggle Sidebar",
        hint: "Ctrl+B",
        icon: "fa-columns",
        action: toggleSidePanel,
      },
      {
        label: "Insert YAML Frontmatter",
        hint: "",
        icon: "fa-code",
        action: insertYAML,
      },
      {
        label: "Export as Markdown",
        hint: "",
        icon: "fa-file-code",
        action: () => exportPaper("markdown"),
      },
      {
        label: "Export as HTML",
        hint: "",
        icon: "fa-file-code",
        action: () => exportPaper("html"),
      },
      {
        label: "Export as PDF",
        hint: "",
        icon: "fa-file-pdf",
        action: () => exportPaper("pdf"),
      },
      {
        label: "Increase Font Size",
        hint: "Ctrl++",
        icon: "fa-plus",
        action: increaseFontSize,
      },
      {
        label: "Decrease Font Size",
        hint: "Ctrl+-",
        icon: "fa-minus",
        action: decreaseFontSize,
      },
      {
        label: "Keyboard Shortcuts",
        hint: "Ctrl+/",
        icon: "fa-keyboard",
        action: () => shortcutsModal && shortcutsModal.classList.add("active"),
      },
      {
        label: "Find",
        hint: "Ctrl+F",
        icon: "fa-search",
        action: () => openFindReplace(false),
      },
      {
        label: "Find and Replace",
        hint: "Ctrl+H",
        icon: "fa-exchange-alt",
        action: () => openFindReplace(true),
      },
    ];

    commands.forEach((cmd) => {
      if (!q || cmd.label.toLowerCase().includes(q)) {
        items.push(cmd);
      }
    });

    items = items.slice(0, 12); // limit
    commandSelectedIndex = Math.min(commandSelectedIndex, items.length - 1);

    commandList.innerHTML = items
      .map(
        (item, i) => `
        <li class="${i === commandSelectedIndex ? "selected" : ""}" data-index="${i}">
          <i class="fas ${item.icon}"></i>
          <span class="command-label">${item.label}</span>
          ${item.hint ? `<span class="command-hint">${item.hint}</span>` : ""}
        </li>`,
      )
      .join("");

    // Click handler
    commandList.querySelectorAll("li").forEach((li) => {
      li.addEventListener("click", () => {
        const idx = parseInt(li.dataset.index);
        if (items[idx]) items[idx].action();
        closeCommandPalette();
      });
    });

    // Store items for keyboard nav
    commandList._items = items;
  }

  if (commandPaletteBtn)
    commandPaletteBtn.addEventListener("click", openCommandPalette);

  if (commandInput) {
    commandInput.addEventListener("input", () => {
      commandSelectedIndex = 0;
      renderCommandList(commandInput.value);
    });

    commandInput.addEventListener("keydown", (e) => {
      const items = commandList._items || [];
      if (e.key === "ArrowDown") {
        e.preventDefault();
        commandSelectedIndex = Math.min(
          commandSelectedIndex + 1,
          items.length - 1,
        );
        renderCommandList(commandInput.value);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        commandSelectedIndex = Math.max(commandSelectedIndex - 1, 0);
        renderCommandList(commandInput.value);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[commandSelectedIndex]) items[commandSelectedIndex].action();
        closeCommandPalette();
      } else if (e.key === "Escape") {
        closeCommandPalette();
      }
    });
  }

  if (commandPalette) {
    commandPalette.addEventListener("click", (e) => {
      if (e.target === commandPalette) closeCommandPalette();
    });
  }

  // ============== RESIZE SASHES ==============
  function initResize(sash, getTarget, direction, minSize, maxSize) {
    if (!sash) return;
    let startPos, startSize;

    function onMouseMove(e) {
      const delta =
        direction === "horizontal"
          ? e.clientX - startPos
          : e.clientY - startPos;
      const newSize = Math.max(minSize, Math.min(maxSize, startSize + delta));
      const target = getTarget();
      if (target) target.style.width = `${newSize}px`;
      sash.classList.add("dragging");
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      sash.classList.remove("dragging");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    sash.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startPos = direction === "horizontal" ? e.clientX : e.clientY;
      const target = getTarget();
      if (target) startSize = target.getBoundingClientRect().width;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }

  // Side panel resize
  initResize(panelSash, () => sidePanel, "horizontal", 160, 500);

  // Editor / preview resize
  initResize(
    editorSash,
    () => document.querySelector(".editor-pane"),
    "horizontal",
    200,
    window.innerWidth - 300,
  );

  // ============== MARKDOWN AUTOCOMPLETE ==============
  const acSuggestions = [
    { label: "# Heading 1", insert: "# ", icon: "fa-heading", hint: "H1" },
    { label: "## Heading 2", insert: "## ", icon: "fa-heading", hint: "H2" },
    { label: "### Heading 3", insert: "### ", icon: "fa-heading", hint: "H3" },
    {
      label: "**Bold**",
      insert: "****",
      icon: "fa-bold",
      hint: "Bold",
      cursor: -2,
    },
    {
      label: "*Italic*",
      insert: "**",
      icon: "fa-italic",
      hint: "Italic",
      cursor: -1,
    },
    {
      label: "~~Strikethrough~~",
      insert: "~~~~",
      icon: "fa-strikethrough",
      hint: "Strike",
      cursor: -2,
    },
    {
      label: "`Inline code`",
      insert: "``",
      icon: "fa-code",
      hint: "Code",
      cursor: -1,
    },
    {
      label: "```Code block```",
      insert: "```\n\n```",
      icon: "fa-file-code",
      hint: "Block",
      cursor: -4,
    },
    {
      label: "[Link](url)",
      insert: "[](url)",
      icon: "fa-link",
      hint: "Link",
      cursor: -6,
    },
    {
      label: "![Image](url)",
      insert: "![](url)",
      icon: "fa-image",
      hint: "Image",
      cursor: -6,
    },
    {
      label: "> Blockquote",
      insert: "> ",
      icon: "fa-quote-right",
      hint: "Quote",
    },
    { label: "- List item", insert: "- ", icon: "fa-list-ul", hint: "UL" },
    { label: "1. Ordered list", insert: "1. ", icon: "fa-list-ol", hint: "OL" },
    {
      label: "- [ ] Task",
      insert: "- [ ] ",
      icon: "fa-check-square",
      hint: "Task",
    },
    { label: "---", insert: "\n\n---\n\n", icon: "fa-minus", hint: "HR" },
    {
      label: "| Table |",
      insert: "| Column | Column |\n| ------ | ------ |\n| Cell   | Cell   |",
      icon: "fa-table",
      hint: "Table",
    },
    {
      label: "$$Math block$$",
      insert: "$$\n\n$$",
      icon: "fa-square-root-alt",
      hint: "Math",
      cursor: -3,
    },
    {
      label: "$Inline math$",
      insert: "$$",
      icon: "fa-superscript",
      hint: "Math",
      cursor: -1,
    },
    {
      label: "Footnote [^1]",
      insert: "[^1]",
      icon: "fa-asterisk",
      hint: "Note",
    },
  ];

  let acDropdown = null;
  let acSelectedIndex = -1;
  let acVisible = false;
  let acFilteredItems = [];

  function createAutocompleteDropdown() {
    if (acDropdown) return;
    acDropdown = document.createElement("div");
    acDropdown.className = "md-autocomplete";
    acDropdown.id = "md-autocomplete";
    const wrap = editor.closest(".editor-input-wrap") || editor.parentElement;
    wrap.appendChild(acDropdown);
  }

  function showAutocomplete(filter) {
    if (!acDropdown) createAutocompleteDropdown();
    const q = filter.toLowerCase();
    acFilteredItems = acSuggestions.filter(
      (s) =>
        s.label.toLowerCase().includes(q) || s.hint.toLowerCase().includes(q),
    );
    if (acFilteredItems.length === 0) {
      hideAutocomplete();
      return;
    }
    acSelectedIndex = 0;
    renderAutocomplete();
    positionAutocomplete();
    acDropdown.classList.add("active");
    acVisible = true;
  }

  function hideAutocomplete() {
    if (acDropdown) acDropdown.classList.remove("active");
    acVisible = false;
    acSelectedIndex = -1;
  }

  function renderAutocomplete() {
    if (!acDropdown) return;
    acDropdown.innerHTML = acFilteredItems
      .map(
        (item, i) => `
      <div class="ac-item ${i === acSelectedIndex ? "selected" : ""}" data-index="${i}">
        <span class="ac-icon"><i class="fas ${item.icon}"></i></span>
        <span class="ac-label">${item.label}</span>
        <span class="ac-hint">${item.hint}</span>
      </div>`,
      )
      .join("");

    acDropdown.querySelectorAll(".ac-item").forEach((el) => {
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        applyAutocomplete(parseInt(el.dataset.index));
      });
    });
  }

  function positionAutocomplete() {
    if (!acDropdown || !editor) return;
    // Position near cursor — approximate based on cursor position
    const pos = editor.selectionStart;
    const textBefore = editor.value.substring(0, pos);
    const lines = textBefore.split("\n");
    const lineIndex = lines.length - 1;
    const colIndex = lines[lineIndex].length;

    const lineH = parseFloat(getComputedStyle(editor).lineHeight) || 20;
    const charW = editorFontSize * 0.6; // approximate monospace char width scaled to font size

    const top = Math.min(
      (lineIndex + 1) * lineH + 4,
      editor.offsetHeight - 200,
    );
    const left = Math.min(colIndex * charW + 12, editor.offsetWidth - 250);

    acDropdown.style.top = `${top}px`;
    acDropdown.style.left = `${left}px`;
  }

  function applyAutocomplete(index) {
    const item = acFilteredItems[index];
    if (!item || !editor) return;

    // Remove the trigger text (/ and what followed)
    const pos = editor.selectionStart;
    const textBefore = editor.value.substring(0, pos);
    const slashIndex = textBefore.lastIndexOf("/");
    if (slashIndex === -1) {
      hideAutocomplete();
      return;
    }

    editorReplaceRange(slashIndex, pos, item.insert);

    // Move cursor
    const newPos = slashIndex + item.insert.length + (item.cursor || 0);
    editor.selectionStart = editor.selectionEnd = newPos;

    hideAutocomplete();
    editor.focus();
    updatePreview();
    updateWordCount();
    updateLineNumbers();
    updateSyntaxHighlight();
    setUnsaved(true);
  }

  // ============== MARKDOWN AUTO-PAIRS ==============
  const autoPairs = {
    "(": ")",
    "[": "]",
    "{": "}",
    '"': '"',
    "'": "'",
    "`": "`",
    "*": "*",
    _: "_",
    "~": "~",
    $: "$",
  };

  function handleAutoPair(e) {
    if (!editor) return;
    const key = e.key;
    const pos = editor.selectionStart;
    const end = editor.selectionEnd;
    const hasSelection = pos !== end;
    const pair = autoPairs[key];

    if (pair && hasSelection) {
      // Wrap selection (undo-safe)
      e.preventDefault();
      const selected = editor.value.substring(pos, end);
      editorReplaceRange(pos, end, key + selected + pair);
      editor.selectionStart = pos + 1;
      editor.selectionEnd = end + 1;
      return true;
    }

    // Auto-close brackets/parens (not quote chars with text after)
    if (pair && "([ {".includes(key)) {
      const charAfter = editor.value[pos] || "";
      if (!charAfter || " \n\t)]}>".includes(charAfter)) {
        e.preventDefault();
        editorReplaceRange(pos, pos, key + pair);
        editor.selectionStart = editor.selectionEnd = pos + 1;
        return true;
      }
    }

    // Skip over closing bracket if cursor is right before it
    const closingChars = Object.values(autoPairs);
    if (closingChars.includes(key) && editor.value[pos] === key) {
      e.preventDefault();
      editor.selectionStart = editor.selectionEnd = pos + 1;
      return true;
    }

    return false;
  }

  // Auto-continue lists on Enter
  function handleListContinuation(e) {
    if (e.key !== "Enter" || !editor) return false;
    const pos = editor.selectionStart;
    const textBefore = editor.value.substring(0, pos);
    const lines = textBefore.split("\n");
    const currentLine = lines[lines.length - 1];

    // Check for list patterns
    const ulMatch = currentLine.match(/^(\s*)([-*+])\s(.+)/);
    const olMatch = currentLine.match(/^(\s*)(\d+)\.\s(.+)/);
    const taskMatch = currentLine.match(/^(\s*)([-*+])\s\[.\]\s(.+)/);
    const emptyUlMatch = currentLine.match(/^(\s*)([-*+])\s$/);
    const emptyOlMatch = currentLine.match(/^(\s*)(\d+)\.\s$/);
    const emptyTaskMatch = currentLine.match(/^(\s*)([-*+])\s\[.\]\s$/);

    // If current list item is empty, remove it (end the list)
    if (emptyUlMatch || emptyOlMatch || emptyTaskMatch) {
      e.preventDefault();
      const lineStart = textBefore.lastIndexOf("\n") + 1;
      editorReplaceRange(lineStart, pos, "\n");
      editor.selectionStart = editor.selectionEnd = lineStart + 1;
      return true;
    }

    // Continue task list
    if (taskMatch) {
      e.preventDefault();
      const indent = taskMatch[1];
      const marker = taskMatch[2];
      const newItem = `\n${indent}${marker} [ ] `;
      editorReplaceRange(pos, pos, newItem);
      editor.selectionStart = editor.selectionEnd = pos + newItem.length;
      return true;
    }

    // Continue unordered list
    if (ulMatch) {
      e.preventDefault();
      const indent = ulMatch[1];
      const marker = ulMatch[2];
      const newItem = `\n${indent}${marker} `;
      editorReplaceRange(pos, pos, newItem);
      editor.selectionStart = editor.selectionEnd = pos + newItem.length;
      return true;
    }

    // Continue ordered list
    if (olMatch) {
      e.preventDefault();
      const indent = olMatch[1];
      const num = parseInt(olMatch[2]) + 1;
      const newItem = `\n${indent}${num}. `;
      editorReplaceRange(pos, pos, newItem);
      editor.selectionStart = editor.selectionEnd = pos + newItem.length;
      return true;
    }

    return false;
  }

  // ============== EDITOR EVENTS ==============
  if (editor) {
    // Debounced versions of expensive operations
    let previewDebounce = null;
    let highlightDebounce = null;
    function debouncedPreview() {
      clearTimeout(previewDebounce);
      previewDebounce = setTimeout(updatePreview, 200);
    }
    function debouncedHighlight() {
      clearTimeout(highlightDebounce);
      highlightDebounce = setTimeout(updateSyntaxHighlight, 40);
    }

    editor.addEventListener("input", () => {
      debouncedPreview();
      updateWordCount();
      updateLineNumbers();
      updateCursorPosition();
      debouncedHighlight();
      setUnsaved(true);

      // Autocomplete trigger: /
      const pos = editor.selectionStart;
      const textBefore = editor.value.substring(0, pos);
      const lineStart = textBefore.lastIndexOf("\n") + 1;
      const currentLine = textBefore.substring(lineStart);
      const slashMatch = currentLine.match(/\/(\w*)$/);
      if (slashMatch) {
        showAutocomplete(slashMatch[1]);
      } else {
        hideAutocomplete();
      }
    });

    editor.addEventListener("click", updateCursorPosition);
    editor.addEventListener("keyup", updateCursorPosition);

    editor.addEventListener("keydown", (e) => {
      // Autocomplete navigation
      if (acVisible) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          acSelectedIndex = (acSelectedIndex + 1) % acFilteredItems.length;
          renderAutocomplete();
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          acSelectedIndex =
            (acSelectedIndex - 1 + acFilteredItems.length) %
            acFilteredItems.length;
          renderAutocomplete();
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          if (acSelectedIndex >= 0) {
            e.preventDefault();
            applyAutocomplete(acSelectedIndex);
            return;
          }
        }
        if (e.key === "Escape") {
          e.preventDefault();
          hideAutocomplete();
          return;
        }
      }

      // Tab indent / Shift+Tab dedent
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          // Dedent: remove up to 2 leading spaces from current line(s)
          const start = editor.selectionStart;
          const end = editor.selectionEnd;
          const text = editor.value;
          const lineStart = text.lastIndexOf("\n", start - 1) + 1;
          const lineEnd = text.indexOf("\n", end);
          const lineBlock = text.substring(
            lineStart,
            lineEnd === -1 ? text.length : lineEnd,
          );
          const lines = lineBlock.split("\n");
          let removedBefore = 0;
          const dedented = lines.map((line, i) => {
            const match = line.match(/^( {1,2})/);
            if (match) {
              if (i === 0) removedBefore = match[1].length;
              return line.substring(match[1].length);
            }
            return line;
          });
          const newBlock = dedented.join("\n");
          const blockEnd = lineEnd === -1 ? text.length : lineEnd;
          editorReplaceRange(lineStart, blockEnd, newBlock);
          editor.selectionStart = Math.max(lineStart, start - removedBefore);
          editor.selectionEnd = Math.max(
            editor.selectionStart,
            end - (lineBlock.length - newBlock.length),
          );
        } else {
          insertAtCursor("  ");
        }
        updateSyntaxHighlight();
        updateLineNumbers();
        setUnsaved(true);
        return;
      }

      // List continuation
      if (handleListContinuation(e)) {
        updatePreview();
        updateWordCount();
        updateLineNumbers();
        updateSyntaxHighlight();
        setUnsaved(true);
        return;
      }

      // Auto-pairs
      if (handleAutoPair(e)) {
        updatePreview();
        updateWordCount();
        updateLineNumbers();
        updateSyntaxHighlight();
        setUnsaved(true);
        return;
      }
    });

    // Proportional scroll sync: editor-scroll → preview
    const editorScrollEl = editor.closest(".editor-scroll");
    if (editorScrollEl && preview) {
      let scrollSyncRaf = null;
      editorScrollEl.addEventListener("scroll", () => {
        if (scrollSyncRaf) return;
        scrollSyncRaf = requestAnimationFrame(() => {
          scrollSyncRaf = null;
          const maxScroll =
            editorScrollEl.scrollHeight - editorScrollEl.clientHeight;
          if (maxScroll <= 0) return;
          const ratio = editorScrollEl.scrollTop / maxScroll;
          const previewMax = preview.scrollHeight - preview.clientHeight;
          preview.scrollTop = ratio * previewMax;
        });
      });
    }

    // Drag and drop
    editor.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    editor.addEventListener("drop", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (
          file.name.endsWith(".md") ||
          file.type === "text/markdown" ||
          file.type === "text/plain"
        ) {
          try {
            const text = await file.text();
            editor.focus();
            editor.selectionStart = 0;
            editor.selectionEnd = editor.value.length;
            editorInsertText(text);
            if (filenameInput && !filenameInput.value)
              filenameInput.value = file.name;
            if (tabFilename)
              tabFilename.textContent = file.name.replace(".md", "");
            updatePreview();
            updateWordCount();
            updateLineNumbers();
            updateSyntaxHighlight();
            setUnsaved(true);
            showToast(`Loaded ${file.name}`, "success");
          } catch (err) {
            showToast("Failed to read file", "error");
          }
        } else {
          showToast("Please drop a .md or .txt file", "error");
        }
      }
    });
  }

  // ============== BUTTON EVENTS ==============
  if (saveBtn) saveBtn.addEventListener("click", savePaper);
  if (newBtnSidebar) newBtnSidebar.addEventListener("click", newPaper);
  if (refreshBtn) refreshBtn.addEventListener("click", loadPapers);
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
  if (fontIncrease) fontIncrease.addEventListener("click", increaseFontSize);
  if (fontDecrease) fontDecrease.addEventListener("click", decreaseFontSize);
  if (distractionFree)
    distractionFree.addEventListener("click", toggleDistractionFree);
  if (yamlBtn) yamlBtn.addEventListener("click", insertYAML);

  // Mobile preview toggle
  if (mobilePreviewToggle) {
    mobilePreviewToggle.addEventListener("click", () => {
      mobilePreviewActive = !mobilePreviewActive;
      if (editorContent)
        editorContent.classList.toggle("show-preview", mobilePreviewActive);
      const icon = mobilePreviewToggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-eye", !mobilePreviewActive);
        icon.classList.toggle("fa-code", mobilePreviewActive);
      }
    });
  }

  // ============== DROPDOWN HANDLING ==============
  function toggleDropdown(btn, menu, ...otherMenus) {
    if (!btn || !menu) return;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("active");
      otherMenus.forEach((m) => {
        if (m) m.classList.remove("active");
      });
    });
  }

  toggleDropdown(exportBtn, exportMenu, insertMenu);
  toggleDropdown(insertBtn, insertMenu, exportMenu);

  // Export options
  document
    .querySelectorAll("#export-menu .dropdown-option")
    .forEach((option) => {
      option.addEventListener("click", () => {
        exportPaper(option.dataset.export);
        if (exportMenu) exportMenu.classList.remove("active");
      });
    });

  // Insert options
  document
    .querySelectorAll("#insert-menu .dropdown-option")
    .forEach((option) => {
      option.addEventListener("click", () => {
        insertAtCursor(insertSnippets[option.dataset.insert] || "");
        if (insertMenu) insertMenu.classList.remove("active");
      });
    });

  // Templates (now in side panel)
  document.querySelectorAll(".template-list .tree-item").forEach((item) => {
    item.addEventListener("click", () => {
      const tpl = item.dataset.template;
      if (
        editor &&
        editor.value &&
        !confirm("This will replace current content. Continue?")
      )
        return;
      if (editor) {
        editor.focus();
        editor.selectionStart = 0;
        editor.selectionEnd = editor.value.length;
        editorInsertText(templates[tpl] || "");
      }
      updatePreview();
      updateWordCount();
      updateLineNumbers();
      updateSyntaxHighlight();
      setUnsaved(true);
      showToast(`Template applied: ${tpl}`, "success");
    });
  });

  // Quick format buttons
  document.querySelectorAll(".quick-format button").forEach((btn) => {
    btn.addEventListener("click", () => {
      let text = btn.dataset.quick || "";
      // HR needs blank lines around it so marked renders <hr> not setext heading
      if (text === "---") {
        const pos = editor.selectionStart;
        const before = editor.value.substring(0, pos);
        const needsLeadingNewline =
          before.length > 0 && !before.endsWith("\n\n");
        text = (needsLeadingNewline ? "\n\n" : "") + "---\n\n";
      }
      insertAtCursor(text);
    });
  });

  // View toggle
  document.querySelectorAll(".view-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".view-toggle button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (editorContent) {
        editorContent.className = "editor-content";
        if (btn.dataset.view === "editor")
          editorContent.classList.add("editor-only");
        else if (btn.dataset.view === "preview")
          editorContent.classList.add("preview-only");
      }
    });
  });

  // Zen toolbar (view switching in distraction-free mode)
  document.querySelectorAll("[data-zen-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-zen-view]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (editorContent) {
        editorContent.className = "editor-content";
        const view = btn.dataset.zenView;
        if (view === "editor") editorContent.classList.add("editor-only");
        else if (view === "preview")
          editorContent.classList.add("preview-only");
      }
      // Sync the main view-toggle buttons too
      const mainBtn = document.querySelector(
        `.view-toggle button[data-view="${btn.dataset.zenView}"]`,
      );
      if (mainBtn) {
        document
          .querySelectorAll(".view-toggle button")
          .forEach((b) => b.classList.remove("active"));
        mainBtn.classList.add("active");
      }
    });
  });
  const zenExit = document.getElementById("zen-exit");
  if (zenExit) {
    zenExit.addEventListener("click", () => toggleDistractionFree());
  }

  // Section toggle (collapsible sections in explorer)
  document.querySelectorAll(".section-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("collapsed");
      const section = btn.dataset.section;
      const list = btn.closest(".panel-section")?.querySelector(".file-tree");
      if (list)
        list.style.display = btn.classList.contains("collapsed") ? "none" : "";
    });
  });

  // Close dropdowns on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      if (exportMenu) exportMenu.classList.remove("active");
      if (insertMenu) insertMenu.classList.remove("active");
    }
  });

  // ============== MODALS ==============
  if (shortcutsBtn && shortcutsModal) {
    shortcutsBtn.addEventListener("click", () =>
      shortcutsModal.classList.add("active"),
    );
  }
  if (closeShortcuts && shortcutsModal) {
    closeShortcuts.addEventListener("click", () =>
      shortcutsModal.classList.remove("active"),
    );
  }
  if (cancelDelete && deleteModal) {
    cancelDelete.addEventListener("click", () =>
      deleteModal.classList.remove("active"),
    );
  }
  if (confirmDelete && deleteModal) {
    confirmDelete.addEventListener("click", () => {
      deletePaper(deleteModal.dataset.file);
      deleteModal.classList.remove("active");
    });
  }

  // ============== EXPORT ==============
  function exportPaper(format) {
    if (!editor) return;
    const content = editor.value;
    const filename = (filenameInput?.value || "paper").replace(".md", "");
    switch (format) {
      case "markdown":
        downloadFile(content, `${filename}.md`, "text/markdown");
        showToast("Exported as Markdown", "success");
        break;
      case "html": {
        const html = window.DOMPurify
          ? DOMPurify.sanitize(marked.parse(content))
          : marked.parse(content);
        const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${filename}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6}h1,h2,h3{margin-top:2rem}code{background:#f4f4f4;padding:2px 6px;border-radius:3px}pre{background:#f4f4f4;padding:1rem;border-radius:6px;overflow-x:auto}</style>
</head><body>${html}</body></html>`;
        downloadFile(fullHtml, `${filename}.html`, "text/html");
        showToast("Exported as HTML", "success");
        break;
      }
      case "text":
        downloadFile(content, `${filename}.txt`, "text/plain");
        showToast("Exported as Plain Text", "success");
        break;
      case "pdf":
        printPaper(content, filename);
        break;
    }
  }

  function printPaper(content, filename) {
    const html = window.DOMPurify
      ? DOMPurify.sanitize(marked.parse(content))
      : marked.parse(content);
    const printWindow = window.open("", "_blank");
    printWindow.document
      .write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${filename}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<style>
@media print{@page{margin:0.75in}}
body{font-family:'Georgia','Times New Roman',serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6;color:#000;background:#fff}
h1{font-size:2rem;margin-bottom:.5rem;font-weight:600}
h2{font-size:1.5rem;margin-top:2rem;margin-bottom:1rem;font-weight:600}
h3{font-size:1.2rem;margin-top:1.5rem;margin-bottom:.75rem;font-weight:600}
p{margin-bottom:1rem}em{font-style:italic;color:#666}strong{font-weight:600}
code{background:#f4f4f4;padding:2px 6px;border-radius:3px;font-family:'Courier New',monospace;font-size:.9em}
pre{background:#f4f4f4;padding:1rem;border-radius:6px;overflow-x:auto;margin:1rem 0}
pre code{background:none;padding:0}
blockquote{border-left:4px solid #ddd;padding-left:1rem;margin:1rem 0;color:#666;font-style:italic}
ul,ol{margin:1rem 0;padding-left:2rem}li{margin-bottom:.5rem}
table{border-collapse:collapse;width:100%;margin:1rem 0}
th,td{border:1px solid #ddd;padding:.5rem;text-align:left}
th{background:#f4f4f4;font-weight:600}a{color:#0066cc;text-decoration:none}
</style></head><body>${html}
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"><\/script>
<script>document.addEventListener('DOMContentLoaded',function(){renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false});setTimeout(function(){window.print();setTimeout(function(){window.close();},100);},500);});<\/script>
</body></html>`);
    printWindow.document.close();
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ============== KEYBOARD SHORTCUTS ==============
  document.addEventListener("keydown", (e) => {
    // F11 — Zen mode
    if (e.key === "F11") {
      e.preventDefault();
      toggleDistractionFree();
      return;
    }

    // Escape — close everything
    if (e.key === "Escape") {
      closeCommandPalette();
      closeFindReplace();
      if (shortcutsModal) shortcutsModal.classList.remove("active");
      if (deleteModal) deleteModal.classList.remove("active");
      if (exportMenu) exportMenu.classList.remove("active");
      if (insertMenu) insertMenu.classList.remove("active");
      if (adminApp && adminApp.classList.contains("distraction-free")) {
        toggleDistractionFree();
      }
      return;
    }

    // Ctrl / Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+Shift+T — theme
      if (e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        toggleTheme();
        return;
      }
      // Ctrl+Shift+E — explorer
      if (e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        const explorerBtn = document.querySelector(
          '.activity-btn[data-panel="explorer"]',
        );
        if (explorerBtn) explorerBtn.click();
        return;
      }

      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          savePaper();
          break;
        case "n":
          e.preventDefault();
          newPaper();
          break;
        case "p":
          e.preventDefault();
          if (commandPalette && commandPalette.classList.contains("active")) {
            closeCommandPalette();
          } else {
            openCommandPalette();
          }
          break;
        case "=":
        case "+":
          e.preventDefault();
          increaseFontSize();
          break;
        case "-":
        case "_":
          e.preventDefault();
          decreaseFontSize();
          break;
        case "b":
          if (document.activeElement === editor) {
            e.preventDefault();
            wrapSelection("**", "**");
          } else {
            e.preventDefault();
            toggleSidePanel();
          }
          break;
        case "i":
          if (document.activeElement === editor) {
            e.preventDefault();
            wrapSelection("*", "*");
          }
          break;
        case "k":
          if (document.activeElement === editor) {
            e.preventDefault();
            wrapSelection("[", "](url)");
          }
          break;
        case "d":
          // Ctrl+D — Duplicate current line
          if (document.activeElement === editor) {
            e.preventDefault();
            const pos = editor.selectionStart;
            const text = editor.value;
            const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
            const lineEnd = text.indexOf("\n", pos);
            const currentLine = text.substring(
              lineStart,
              lineEnd === -1 ? text.length : lineEnd,
            );
            const insertAt = lineEnd === -1 ? text.length : lineEnd;
            editorReplaceRange(insertAt, insertAt, "\n" + currentLine);
            editor.selectionStart = editor.selectionEnd =
              pos + currentLine.length + 1;
            updatePreview();
            updateWordCount();
            updateLineNumbers();
            updateSyntaxHighlight();
            setUnsaved(true);
          }
          break;
        case "f":
          e.preventDefault();
          openFindReplace(false);
          break;
        case "h":
          e.preventDefault();
          openFindReplace(true);
          break;
        case "/":
          e.preventDefault();
          if (shortcutsModal) shortcutsModal.classList.add("active");
          break;
      }
    }
  });

  // Warn before leaving
  window.addEventListener("beforeunload", (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  // ============== INITIALIZE ==============
  initTheme();
  updateFontSize();
  showLoginScreen();
  checkAuth();

  console.log("Admin panel ready");
});
