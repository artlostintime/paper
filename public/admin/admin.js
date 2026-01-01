// ============== ADMIN PANEL - CLEAN REBUILD ==============
console.log("script.js loaded!");

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("Admin panel initializing...");

  // ============== DOM ELEMENTS ==============
  const loginScreen = document.getElementById("login-screen");
  const adminApp = document.getElementById("admin-app");
  const loginForm = document.getElementById("login-form");
  const loginPassword = document.getElementById("login-password");
  const loginError = document.getElementById("login-error");
  const togglePasswordBtn = document.getElementById("toggle-password");
  const logoutBtn = document.getElementById("logout-btn");
  const paperList = document.getElementById("paper-list");
  const paperCount = document.getElementById("paper-count");
  const filenameInput = document.getElementById("filename");
  const editor = document.getElementById("markdown-editor");
  const preview = document.getElementById("preview-content");
  const editorContent = document.getElementById("editor-content");
  const saveBtn = document.getElementById("save-btn");
  const templateBtn = document.getElementById("template-btn");
  const templateMenu = document.getElementById("template-menu");
  const exportBtn = document.getElementById("export-btn");
  const exportMenu = document.getElementById("export-menu");
  const insertBtn = document.getElementById("insert-btn");
  const insertMenu = document.getElementById("insert-menu");
  const toast = document.getElementById("toast");
  const deleteModal = document.getElementById("delete-modal");
  const deleteFilename = document.getElementById("delete-filename");
  const shortcutsModal = document.getElementById("shortcuts-modal");
  const unsavedDot = document.getElementById("unsaved-dot");
  const autosaveIndicator = document.getElementById("autosave-indicator");
  const searchInput = document.getElementById("search-papers");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const adminContainer = document.querySelector(".admin-container");
  const newBtnSidebar = document.getElementById("new-btn-sidebar");
  const shortcutsBtn = document.getElementById("shortcuts-btn");
  const closeShortcuts = document.getElementById("close-shortcuts");
  const cancelDelete = document.getElementById("cancel-delete");
  const confirmDelete = document.getElementById("confirm-delete");
  const themeToggle = document.getElementById("theme-toggle");
  const fontIncrease = document.getElementById("font-increase");
  const fontDecrease = document.getElementById("font-decrease");
  const distractionFree = document.getElementById("distraction-free");

  // ============== STATE ==============
  let papers = [];
  let currentFile = null;
  let hasUnsavedChanges = false;
  let autosaveTimer = null;
  let searchQuery = "";
  let editorFontSize = 14; // Default font size in pixels
  let currentTheme = localStorage.getItem("adminTheme") || "dark";

  // Warn before leaving with unsaved changes
  window.addEventListener("beforeunload", (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue =
        "You have unsaved changes. Are you sure you want to leave?";
      return e.returnValue;
    }
  });

  // Initialize theme
  function initTheme() {
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    if (themeToggle) {
      const icon = themeToggle.querySelector("i");
      if (currentTheme === "dark") {
        icon.className = "fas fa-sun";
        themeToggle.title = "Switch to Light Theme";
      } else {
        icon.className = "fas fa-moon";
        themeToggle.title = "Switch to Dark Theme";
      }
    }
  }

  function toggleTheme() {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("adminTheme", currentTheme);
    updateThemeIcon();
    showToast(`Switched to ${currentTheme} theme`, "success");
  }

  // Font size controls
  function updateFontSize() {
    if (editor) {
      editor.style.fontSize = `${editorFontSize}px`;
      localStorage.setItem("editorFontSize", editorFontSize);
    }
  }

  function increaseFontSize() {
    if (editorFontSize < 24) {
      editorFontSize++;
      updateFontSize();
      showToast(`Font size: ${editorFontSize}px`, "info");
    }
  }

  function decreaseFontSize() {
    if (editorFontSize > 10) {
      editorFontSize--;
      updateFontSize();
      showToast(`Font size: ${editorFontSize}px`, "info");
    }
  }

  // Distraction-free mode
  function toggleDistractionFree() {
    if (adminContainer) {
      adminContainer.classList.toggle("distraction-free");
      const isActive = adminContainer.classList.contains("distraction-free");
      if (distractionFree) {
        const icon = distractionFree.querySelector("i");
        icon.className = isActive ? "fas fa-compress" : "fas fa-expand";
        distractionFree.title = isActive
          ? "Exit Distraction Free (F11)"
          : "Distraction Free (F11)";
      }
      showToast(
        isActive
          ? "Distraction-free mode enabled"
          : "Distraction-free mode disabled",
        "info"
      );
    }
  }

  // Initialize font size from localStorage
  const savedFontSize = localStorage.getItem("editorFontSize");
  if (savedFontSize) {
    editorFontSize = parseInt(savedFontSize);
  }

  // ============== AUTHENTICATION ==============
  function showLoginScreen() {
    if (loginScreen) {
      loginScreen.classList.remove("hidden");
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
    console.log("Showing admin panel");
    if (loginScreen) {
      loginScreen.classList.add("hidden");
      loginScreen.style.display = "none";
    }
    if (adminApp) {
      adminApp.style.display = "block";
      adminApp.classList.remove("hidden");
    }
    loadPapers();
  }

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/check", {
        credentials: "same-origin",
      });
      const data = await res.json();
      console.log("Auth check:", data);
      if (data.authenticated === true) {
        showAdminPanel();
      } else {
        showLoginScreen();
      }
    } catch (e) {
      console.log("Auth check error:", e);
      showLoginScreen();
    }
  }

  // Login form handler
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
        console.log("Login response:", data);

        if (data.success) {
          showAdminPanel();
        } else {
          if (loginError)
            loginError.textContent = data.error || "Invalid password";
          if (loginPassword) loginPassword.select();
        }
      } catch (e) {
        console.error("Login error:", e);
        if (loginError) loginError.textContent = "Connection error. Try again.";
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
      }
    });
  }

  // Toggle password visibility
  if (togglePasswordBtn && loginPassword) {
    togglePasswordBtn.addEventListener("click", () => {
      const type = loginPassword.type === "password" ? "text" : "password";
      loginPassword.type = type;
      togglePasswordBtn.innerHTML = `<i class="fas fa-eye${
        type === "password" ? "" : "-slash"
      }"></i>`;
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (
        hasUnsavedChanges &&
        !confirm("You have unsaved changes. Logout anyway?")
      ) {
        return;
      }
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
      } catch (e) {}
      showLoginScreen();
      showToast("Logged out successfully", "success");
    });
  }

  // ============== PAPERS MANAGEMENT ==============
  async function loadPapers() {
    console.log("Loading papers...");
    try {
      const res = await fetch("/api/papers", {
        credentials: "same-origin",
      });
      const data = await res.json();
      console.log("Papers response:", data);

      // Handle different response formats
      if (Array.isArray(data)) {
        papers = data;
      } else if (Array.isArray(data.files)) {
        // API returns { files: ["file1.md", "file2.md", ...] }
        papers = data.files;
      } else if (data.files && typeof data.files === "object") {
        // API returns { files: { "file1.md": {...}, ... } }
        papers = Object.keys(data.files);
      } else if (typeof data === "object") {
        papers = Object.keys(data);
      } else {
        papers = [];
      }
      console.log("Parsed papers:", papers);
      renderPaperList();
    } catch (e) {
      console.error("Load papers error:", e);
      showToast("Failed to load papers", "error");
    }
  }

  function renderPaperList() {
    if (!paperList) return;

    const filtered = searchQuery
      ? papers.filter((p) =>
          p.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : papers;

    if (paperCount) paperCount.textContent = papers.length;

    if (filtered.length === 0) {
      paperList.innerHTML = `
        <li class="empty-state" style="padding: 2rem; border: none; text-align: center;">
          <i class="fas fa-file-alt" style="font-size: 2rem; opacity: 0.3;"></i>
          <p style="margin-top: 0.5rem; color: var(--text-muted);">
            ${searchQuery ? "No papers found" : "No papers yet"}
          </p>
        </li>`;
      return;
    }

    paperList.innerHTML = filtered
      .map((filename) => {
        // Check if file was modified recently (within 24 hours)
        const isRecent = false; // Will be true when we have file metadata
        return `
      <li class="paper-item ${
        currentFile === filename ? "active" : ""
      }" data-file="${filename}">
        <div class="paper-item-info">
          <h3>${filename.replace(".md", "").replace(/-/g, " ")}${
          isRecent
            ? ' <span class="recent-badge" title="Modified recently">🔥</span>'
            : ""
        }</h3>
          <p><i class="fas fa-file-alt"></i> ${filename}</p>
        </div>
        <div class="paper-item-actions">
          <button class="icon-btn duplicate" data-file="${filename}" title="Duplicate">
            <i class="fas fa-copy"></i>
          </button>
          <button class="icon-btn delete" data-file="${filename}" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </li>
    `;
      })
      .join("");

    // Click handlers for paper items
    paperList.querySelectorAll(".paper-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (!e.target.closest(".icon-btn")) {
          loadPaper(item.dataset.file);
        }
      });
    });

    // Delete buttons
    paperList.querySelectorAll(".icon-btn.delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        showDeleteModal(btn.dataset.file);
      });
    });

    // Duplicate buttons
    paperList.querySelectorAll(".icon-btn.duplicate").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        duplicatePaper(btn.dataset.file);
      });
    });
  }

  async function loadPaper(filename) {
    if (hasUnsavedChanges && !confirm("You have unsaved changes. Continue?")) {
      return;
    }

    console.log("Loading paper:", filename);
    try {
      const res = await fetch(`/api/papers/${encodeURIComponent(filename)}`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const content = data.content || "";

      currentFile = filename;
      if (filenameInput) filenameInput.value = filename;
      if (editor) editor.value = content;
      updatePreview();
      updateWordCount();
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
      const content = data.content || "";

      const newFilename = filename.replace(".md", "-copy.md");
      if (filenameInput) filenameInput.value = newFilename;
      if (editor) editor.value = content;
      currentFile = null;
      updatePreview();
      updateWordCount();
      setUnsaved(true);
      renderPaperList();
      showToast("Paper duplicated - remember to save!", "info");
    } catch (e) {
      console.error("Duplicate error:", e);
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

      if (currentFile === filename) {
        newPaper();
      }
      showToast("Paper deleted", "success");
      loadPapers();
    } catch (e) {
      console.error("Delete error:", e);
      showToast("Failed to delete", "error");
    }
  }

  function newPaper() {
    if (hasUnsavedChanges && !confirm("You have unsaved changes. Continue?")) {
      return;
    }

    currentFile = null;
    if (filenameInput) filenameInput.value = "";
    if (editor) editor.value = "";
    if (preview) {
      preview.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-file-alt"></i>
          <h3>Live Preview</h3>
          <p>Start typing to see your formatted paper</p>
        </div>`;
    }
    updateWordCount();
    setUnsaved(false);
    updateAutosaveIndicator("ready");
    renderPaperList();
    if (filenameInput) filenameInput.focus();
  }

  // ============== PREVIEW & EDITOR ==============
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

    // Remove tag lines (lines that are only hashtags)
    const cleanContent = content
      .replace(/^#[\w-]+(\s+#[\w-]+)*\s*$/gm, "")
      .trim();

    // Parse markdown with XSS sanitization
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

    // Render KaTeX math
    if (window.renderMathInElement) {
      try {
        renderMathInElement(preview, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
          throwOnError: false,
        });
      } catch (e) {
        console.log("KaTeX error:", e);
      }
    }
  }

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

  function setUnsaved(value) {
    hasUnsavedChanges = value;
    if (unsavedDot) unsavedDot.classList.toggle("show", value);

    // Autosave after 5 seconds if there are changes
    if (value && currentFile) {
      clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(() => {
        if (hasUnsavedChanges) savePaper();
      }, 5000);
    }
  }

  function updateAutosaveIndicator(status) {
    if (!autosaveIndicator) return;
    autosaveIndicator.className = "autosave-indicator";

    switch (status) {
      case "saving":
        autosaveIndicator.classList.add("saving");
        autosaveIndicator.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Saving...';
        break;
      case "saved":
        autosaveIndicator.classList.add("saved");
        autosaveIndicator.innerHTML = '<i class="fas fa-check"></i> Saved';
        break;
      case "error":
        autosaveIndicator.innerHTML =
          '<i class="fas fa-exclamation-triangle"></i> Error';
        break;
      default:
        autosaveIndicator.innerHTML = '<i class="fas fa-circle"></i> Ready';
    }
  }

  function insertAtCursor(text) {
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const before = editor.value.substring(0, start);
    const after = editor.value.substring(end);

    editor.value = before + text + after;
    editor.focus();
    editor.selectionStart = editor.selectionEnd = start + text.length;

    updatePreview();
    updateWordCount();
    setUnsaved(true);
  }

  function wrapSelection(before, after) {
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.substring(start, end);
    const beforeText = editor.value.substring(0, start);
    const afterText = editor.value.substring(end);

    editor.value = beforeText + before + selected + after + afterText;
    editor.focus();
    editor.selectionStart = start + before.length;
    editor.selectionEnd = end + before.length;

    updatePreview();
    updateWordCount();
    setUnsaved(true);
  }

  // ============== UI HELPERS ==============
  function showToast(message, type = "success") {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove("show"), 2500);
  }

  function showDeleteModal(filename) {
    if (!deleteModal || !deleteFilename) return;
    deleteFilename.textContent = filename;
    deleteModal.classList.add("show");
    deleteModal.dataset.file = filename;
  }

  // ============== TEMPLATES ==============
  const templates = {
    basic: `# Paper Title

*Your Name — ${new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}*

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

    research: `#clinical #research

# Research Paper Title

*Your Name — ${new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}*

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

    notes: `# Quick Notes: Topic Name

*${new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}*

## Key Points

- Point 1
- Point 2
- Point 3

## Summary

Brief summary here...

## References

- Source 1
- Source 2`,

    clinical: `#clinical #case-study

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

    experiment: `#research #experimental

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

    summary: `#summary #literature

# Paper Summary: [Original Title]

**Original Authors:** Author et al. (Year)

**Summarized by:** Your Name — ${new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}

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

  // ============== EVENT LISTENERS ==============

  // Editor input
  if (editor) {
    editor.addEventListener("input", () => {
      updatePreview();
      updateWordCount();
      setUnsaved(true);
    });

    editor.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        insertAtCursor("  ");
      }
    });

    // Drag and drop file upload
    editor.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      editor.classList.add("drag-over");
    });

    editor.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      editor.classList.remove("drag-over");
    });

    editor.addEventListener("drop", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      editor.classList.remove("drag-over");

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
            editor.value = text;
            if (filenameInput && !filenameInput.value) {
              filenameInput.value = file.name;
            }
            updatePreview();
            updateWordCount();
            setUnsaved(true);
            showToast(`Loaded ${file.name}`, "success");
          } catch (error) {
            showToast("Failed to read file", "error");
          }
        } else {
          showToast("Please drop a .md or .txt file", "error");
        }
      }
    });
  }

  // Save button
  if (saveBtn) saveBtn.addEventListener("click", savePaper);

  // New paper button
  if (newBtnSidebar) newBtnSidebar.addEventListener("click", newPaper);

  // Search with debouncing
  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        renderPaperList();
      }, 300);
    });
  }

  // Sidebar toggle
  if (sidebarToggle && adminContainer) {
    sidebarToggle.addEventListener("click", () => {
      adminContainer.classList.toggle("sidebar-collapsed");
      const isCollapsed =
        adminContainer.classList.contains("sidebar-collapsed");
      try {
        localStorage.setItem("sidebarCollapsed", isCollapsed);
      } catch (e) {}

      const icon = sidebarToggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-chevron-left", !isCollapsed);
        icon.classList.toggle("fa-chevron-right", isCollapsed);
      }
    });

    // Restore sidebar state
    try {
      if (localStorage.getItem("sidebarCollapsed") === "true") {
        adminContainer.classList.add("sidebar-collapsed");
        const icon = sidebarToggle.querySelector("i");
        if (icon) {
          icon.classList.remove("fa-chevron-left");
          icon.classList.add("fa-chevron-right");
        }
      }
    } catch (e) {}
  }

  // Export dropdown
  if (exportBtn && exportMenu) {
    exportBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle("show");
      if (templateMenu) templateMenu.classList.remove("show");
      if (insertMenu) insertMenu.classList.remove("show");
    });
  }

  // Export options
  document
    .querySelectorAll("#export-menu .dropdown-option")
    .forEach((option) => {
      option.addEventListener("click", () => {
        const format = option.dataset.export;
        exportPaper(format);
        if (exportMenu) exportMenu.classList.remove("show");
      });
    });

  function exportPaper(format) {
    if (!editor) return;
    const content = editor.value;
    const filename = (filenameInput?.value || "paper").replace(".md", "");

    switch (format) {
      case "markdown":
        downloadFile(content, `${filename}.md`, "text/markdown");
        showToast("Exported as Markdown", "success");
        break;
      case "html":
        const html = marked.parse(content);
        const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
    h1, h2, h3 { margin-top: 2rem; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
        downloadFile(fullHtml, `${filename}.html`, "text/html");
        showToast("Exported as HTML", "success");
        break;
      case "text":
        downloadFile(content, `${filename}.txt`, "text/plain");
        showToast("Exported as Plain Text", "success");
        break;
      case "pdf":
        printPaper(content, filename);
        showToast("Opening print dialog...", "info");
        break;
    }
  }

  function printPaper(content, filename) {
    // Convert markdown to HTML
    const html = marked.parse(content);

    // Create a temporary print window
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    @media print {
      @page { margin: 0.75in; }
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #000;
      background: #fff;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    h2 {
      font-size: 1.5rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    h3 {
      font-size: 1.2rem;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      font-weight: 600;
    }
    p {
      margin-bottom: 1rem;
    }
    em {
      font-style: italic;
      color: #666;
    }
    strong {
      font-weight: 600;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre {
      background: #f4f4f4;
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      margin: 1rem 0;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1rem;
      margin: 1rem 0;
      color: #666;
      font-style: italic;
    }
    ul, ol {
      margin: 1rem 0;
      padding-left: 2rem;
    }
    li {
      margin-bottom: 0.5rem;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5rem;
      text-align: left;
    }
    th {
      background: #f4f4f4;
      font-weight: 600;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
${html}
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ],
      throwOnError: false
    });
    // Auto-print after rendering
    setTimeout(function() {
      window.print();
      // Close after printing (user can cancel)
      setTimeout(function() {
        window.close();
      }, 100);
    }, 500);
  });
</script>
</body>
</html>
    `);
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

  // Template dropdown
  if (templateBtn && templateMenu) {
    templateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      templateMenu.classList.toggle("show");
      if (exportMenu) exportMenu.classList.remove("show");
      if (insertMenu) insertMenu.classList.remove("show");
    });
  }

  document
    .querySelectorAll("#template-menu .dropdown-option")
    .forEach((option) => {
      option.addEventListener("click", () => {
        const template = templates[option.dataset.template];
        if (
          editor &&
          editor.value &&
          !confirm("This will replace current content. Continue?")
        ) {
          return;
        }
        if (editor) editor.value = template || "";
        updatePreview();
        updateWordCount();
        setUnsaved(true);
        if (templateMenu) templateMenu.classList.remove("show");
      });
    });

  // Insert dropdown
  if (insertBtn && insertMenu) {
    insertBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      insertMenu.classList.toggle("show");
      if (templateMenu) templateMenu.classList.remove("show");
    });
  }

  document
    .querySelectorAll("#insert-menu .dropdown-option")
    .forEach((option) => {
      option.addEventListener("click", () => {
        insertAtCursor(insertSnippets[option.dataset.insert] || "");
        if (insertMenu) insertMenu.classList.remove("show");
      });
    });

  // Quick insert buttons
  document.querySelectorAll(".quick-insert button").forEach((btn) => {
    btn.addEventListener("click", () =>
      insertAtCursor(btn.dataset.quick || "")
    );
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
        if (btn.dataset.view === "editor") {
          editorContent.classList.add("editor-only");
        } else if (btn.dataset.view === "preview") {
          editorContent.classList.add("preview-only");
        }
      }
    });
  });

  // Shortcuts modal
  if (shortcutsBtn && shortcutsModal) {
    shortcutsBtn.addEventListener("click", () =>
      shortcutsModal.classList.add("show")
    );
  }
  if (closeShortcuts && shortcutsModal) {
    closeShortcuts.addEventListener("click", () =>
      shortcutsModal.classList.remove("show")
    );
  }

  // Delete modal
  if (cancelDelete && deleteModal) {
    cancelDelete.addEventListener("click", () =>
      deleteModal.classList.remove("show")
    );
  }
  if (confirmDelete && deleteModal) {
    confirmDelete.addEventListener("click", () => {
      deletePaper(deleteModal.dataset.file);
      deleteModal.classList.remove("show");
    });
  }

  // Close dropdowns on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      if (templateMenu) templateMenu.classList.remove("show");
      if (insertMenu) insertMenu.classList.remove("show");
      if (exportMenu) exportMenu.classList.remove("show");
    }
  });

  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Font size controls
  if (fontIncrease) {
    fontIncrease.addEventListener("click", increaseFontSize);
  }
  if (fontDecrease) {
    fontDecrease.addEventListener("click", decreaseFontSize);
  }

  // Distraction-free mode
  if (distractionFree) {
    distractionFree.addEventListener("click", toggleDistractionFree);
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // F11 for distraction-free
    if (e.key === "F11") {
      e.preventDefault();
      toggleDistractionFree();
      return;
    }

    // Escape to close modals
    if (e.key === "Escape") {
      if (shortcutsModal) shortcutsModal.classList.remove("show");
      if (deleteModal) deleteModal.classList.remove("show");
      if (templateMenu) templateMenu.classList.remove("show");
      if (insertMenu) insertMenu.classList.remove("show");
      if (exportMenu) exportMenu.classList.remove("show");
      // Exit distraction-free on Escape
      if (
        adminContainer &&
        adminContainer.classList.contains("distraction-free")
      ) {
        toggleDistractionFree();
      }
    }

    // Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+Shift combinations
      if (e.shiftKey) {
        if (e.key.toLowerCase() === "t") {
          e.preventDefault();
          toggleTheme();
          return;
        }
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
        case "f":
          // Allow browser's native find (Ctrl+F)
          // Don't preventDefault - let browser handle it
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
            if (adminContainer)
              adminContainer.classList.toggle("sidebar-collapsed");
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
        case "/":
          e.preventDefault();
          if (shortcutsModal) shortcutsModal.classList.add("show");
          break;
      }
    }
  });

  // Warn before leaving with unsaved changes
  window.addEventListener("beforeunload", (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  // ============== INITIALIZE ==============
  // Initialize theme and font size
  initTheme();
  updateFontSize();

  // Force login screen visible initially
  showLoginScreen();

  // Then check auth status
  checkAuth();

  console.log("Admin panel ready");
});
