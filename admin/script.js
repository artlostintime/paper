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

  // ============== STATE ==============
  let papers = [];
  let currentFile = null;
  let hasUnsavedChanges = false;
  let autosaveTimer = null;
  let searchQuery = "";

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
      const res = await fetch("/api/auth/check");
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
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (e) {}
      showLoginScreen();
      showToast("Logged out successfully", "success");
    });
  }

  // ============== PAPERS MANAGEMENT ==============
  async function loadPapers() {
    console.log("Loading papers...");
    try {
      const res = await fetch("/api/papers");
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
      .map(
        (filename) => `
      <li class="paper-item ${
        currentFile === filename ? "active" : ""
      }" data-file="${filename}">
        <div class="paper-item-info">
          <h3>${filename.replace(".md", "").replace(/-/g, " ")}</h3>
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
    `
      )
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
      const res = await fetch(`/api/papers/${encodeURIComponent(filename)}`);
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
      const res = await fetch(`/api/papers/${encodeURIComponent(filename)}`);
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

  // Template dropdown
  if (templateBtn && templateMenu) {
    templateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      templateMenu.classList.toggle("show");
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
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Escape to close modals
    if (e.key === "Escape") {
      if (shortcutsModal) shortcutsModal.classList.remove("show");
      if (deleteModal) deleteModal.classList.remove("show");
      if (templateMenu) templateMenu.classList.remove("show");
      if (insertMenu) insertMenu.classList.remove("show");
    }

    // Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          savePaper();
          break;
        case "n":
          e.preventDefault();
          newPaper();
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
  // Force login screen visible initially
  showLoginScreen();

  // Then check auth status
  checkAuth();

  console.log("Admin panel ready");
});
