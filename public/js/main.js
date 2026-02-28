// DOM Elements
const menuBtn = document.getElementById("menu-toggle");
const closeBtn = document.getElementById("close-btn");
const sidePanel = document.getElementById("side-panel");
const overlay = document.getElementById("overlay");
const navLinks = document.querySelectorAll(".nav-link");
const themeBtn = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeText = document.getElementById("theme-text");
const htmlEl = document.documentElement;
const backToTopBtn = document.getElementById("back-to-top");

// --- PAGE LOADER ---
window.addEventListener("load", () => {
  const loader = document.getElementById("page-loader");
  if (loader) {
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 300);
  }
});

// --- PANEL LOGIC ---
function openPanel() {
  sidePanel.classList.add("open");
  overlay.classList.add("active");
}

function closePanel() {
  sidePanel.classList.remove("open");
  overlay.classList.remove("active");
}

// Triggers
if (menuBtn) menuBtn.addEventListener("click", openPanel);
if (closeBtn) closeBtn.addEventListener("click", closePanel);
if (overlay) overlay.addEventListener("click", closePanel);

// Close when clicking a link (Mobile UX)
navLinks.forEach((link) => {
  link.addEventListener("click", closePanel);
});

// --- THEME LOGIC ---
const savedTheme = localStorage.getItem("theme") || "dark";
setTheme(savedTheme);

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const currentTheme = htmlEl.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  });
}

function setTheme(theme) {
  htmlEl.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  if (themeIcon && themeText) {
    if (theme === "dark") {
      themeIcon.className = "fas fa-sun";
      themeText.textContent = "Light Mode";
    } else {
      themeIcon.className = "fas fa-moon";
      themeText.textContent = "Dark Mode";
    }
  }
}

// --- BACK TO TOP BUTTON ---
if (backToTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 500) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }

    // Fade out scroll cue in hero after scrolling
    const scrollCue = document.querySelector(".scroll-cue");
    if (scrollCue) {
      scrollCue.style.opacity = window.scrollY > 120 ? "0" : "";
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// --- SECTION REVEAL & ACTIVE NAV ---
const observerOptions = {
  root: null,
  rootMargin: "-10% 0px -40% 0px",
  threshold: 0,
};

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    // Animate sections
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");

      // Update active nav link
      const id = entry.target.getAttribute("id");
      if (id) {
        document.querySelectorAll(".nav-link").forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${id}`) {
            link.classList.add("active");
          }
        });
      }
    }
  });
}, observerOptions);

// Observe sections and dividers
document.querySelectorAll(".chapter, .section-divider").forEach((el) => {
  sectionObserver.observe(el);
});

// --- KEYBOARD NAVIGATION ---
document.addEventListener("keydown", (e) => {
  // Escape closes panel
  if (e.key === "Escape") {
    closePanel();
  }

  // "/" focuses search (if not already in input)
  if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
    e.preventDefault();
    const searchInput = document.getElementById("search-papers");
    if (searchInput) searchInput.focus();
  }

  // Arrow keys for pagination (when not in input)
  if (document.activeElement.tagName !== "INPUT" && isFullView) {
    const totalPages = Math.ceil(filteredPapers.length / ITEMS_PER_PAGE);
    if (e.key === "ArrowLeft" && currentPage > 1) {
      currentPage--;
      updateDisplay(true);
    } else if (e.key === "ArrowRight" && currentPage < totalPages) {
      currentPage++;
      updateDisplay(true);
    }
  }
});

// --- DYNAMIC MARKDOWN LOADER WITH PAGINATION, SEARCH & CATEGORIES ---

// Configuration
const ITEMS_INITIAL = 4;
const ITEMS_PER_PAGE = 10;
const RECENT_DAYS = 7; // Papers modified within X days are marked "recent"

// Category map — loaded from server (single source of truth)
let CATEGORY_MAP = {};

// State
let paperFiles = [];
let paperMetadata = {}; // Store file metadata (mtime, category)
let filteredPapers = [];
let paperContents = {}; // Cache for rendering (populated on-demand)
let isFullView = false;
let currentPage = 1;
let searchQuery = "";
let activeCategory = "all";

const container = document.getElementById("papers-container");
const viewMoreBtn = document.getElementById("view-more-btn");
const paginationContainer = document.getElementById("pagination");
const skeletonLoader = document.getElementById("skeleton-loader");
const paperCountEl = document.getElementById("paper-count");
const noResultsEl = document.getElementById("no-results");
const searchInput = document.getElementById("search-papers");
const clearSearchBtn = document.getElementById("clear-search");
const categoryFilter = document.getElementById("category-filter");

// Get category for a file
function getCategory(filename) {
  const baseName = filename.replace(".md", "").toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (value.files.some((f) => baseName.includes(f))) {
      return { key, ...value };
    }
  }
  return { key: "other", icon: "fa-file-alt", label: "Other" };
}

// Check if paper is recent (within RECENT_DAYS)
function isRecent(mtime) {
  if (!mtime) return false;
  const mtimeDate = new Date(mtime);
  const now = new Date();
  const diffDays = (now - mtimeDate) / (1000 * 60 * 60 * 24);
  return diffDays <= RECENT_DAYS;
}

// Reading time calculator
function getReadingTime(text) {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

// Build category filter buttons
function buildCategoryFilter() {
  if (!categoryFilter) return;

  // Get unique categories from papers
  const usedCategories = new Set();
  paperFiles.forEach((filename) => {
    const cat = getCategory(filename);
    usedCategories.add(cat.key);
  });

  // Create buttons
  categoryFilter.innerHTML = `
    <button class="filter-btn active" data-category="all">
      <i class="fas fa-layer-group"></i> All
    </button>
  `;

  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (usedCategories.has(key)) {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.dataset.category = key;
      btn.innerHTML = `<i class="fas ${value.icon}"></i> ${value.label}`;
      categoryFilter.appendChild(btn);
    }
  }

  // Add click handlers
  categoryFilter.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryFilter
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category;
      applyFilters();
    });
  });
}

// Apply both search and category filters (uses server-side search)
async function applyFilters() {
  // If we have a search query or category filter, use the server-side search API
  if (searchQuery || activeCategory !== "all") {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (activeCategory !== "all") params.set("category", activeCategory);

      const response = await fetch(`/api/papers/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        filteredPapers = data.files || [];
      } else {
        filteredPapers = [];
      }
    } catch (e) {
      console.error("Search error:", e);
      filteredPapers = [];
    }
  } else {
    filteredPapers = [...paperFiles];
  }

  currentPage = 1;
  updateDisplay(false);
}

// Fetch the list of papers from the server API
async function loadPaperList() {
  if (!container) return;

  // Show skeleton loader
  if (skeletonLoader) skeletonLoader.style.display = "block";

  try {
    // Load category map from server (single source of truth)
    if (Object.keys(CATEGORY_MAP).length === 0) {
      try {
        const catRes = await fetch("/api/categories");
        if (catRes.ok) CATEGORY_MAP = await catRes.json();
      } catch (e) {
        console.warn("Could not load categories, using defaults");
      }
    }

    const response = await fetch("/api/papers");
    if (!response.ok) throw new Error("Could not fetch paper list");
    const data = await response.json();

    // Handle both array and object responses
    if (Array.isArray(data)) {
      paperFiles = data;
    } else {
      paperFiles = data.files || [];
      paperMetadata = data.metadata || {};
    }

    filteredPapers = [...paperFiles];

    // Build category filter
    buildCategoryFilter();

    // Hide skeleton
    if (skeletonLoader) skeletonLoader.style.display = "none";

    updateDisplay(false);
  } catch (error) {
    console.error("Error loading paper list:", error);
    if (skeletonLoader) skeletonLoader.style.display = "none";
    if (container) {
      container.innerHTML = `
        <div class="error-container">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Could not load papers. Make sure the server is running:</p>
          <code>node server.js</code>
          <button onclick="loadPaperList()" class="btn-text" style="margin-top:1rem;cursor:pointer">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>`;
    }
  }
}

// Search/filter papers (now uses server-side search)
function filterPapers(query) {
  searchQuery = query.toLowerCase().trim();
  applyFilters();
}

// Remove keyword lines from markdown (lines with only hashtags)
function removeKeywordLine(text) {
  return text.replace(/^#[\w-]+(\s+#[\w-]+)*\s*$/gm, "").trim();
}

// Update paper count display
function updatePaperCount(showing, total) {
  if (paperCountEl) {
    if (searchQuery) {
      paperCountEl.textContent = `Found ${total} paper${
        total !== 1 ? "s" : ""
      } matching "${searchQuery}"`;
    } else if (isFullView) {
      const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
      const end = Math.min(currentPage * ITEMS_PER_PAGE, total);
      paperCountEl.textContent = `Showing ${start}-${end} of ${total} papers`;
    } else {
      paperCountEl.textContent = `Showing ${showing} of ${total} papers`;
    }
  }
}

// Main Function to Render Papers (Preview on index page - NO KEYWORDS)
async function renderPapers(filesToRender) {
  if (!container) return;
  container.innerHTML = "";

  if (filesToRender.length === 0) {
    if (noResultsEl) noResultsEl.style.display = "block";
    return;
  } else {
    if (noResultsEl) noResultsEl.style.display = "none";
  }

  // Batch-fetch uncached papers in one request
  const uncached = filesToRender.filter((f) => !paperContents[f]);
  if (uncached.length > 0) {
    try {
      const batchRes = await fetch(
        `/api/papers/batch?files=${uncached.join(",")}`,
      );
      if (batchRes.ok) {
        const batchData = await batchRes.json();
        for (const [file, data] of Object.entries(batchData)) {
          paperContents[file] = data.content;
        }
      }
    } catch (e) {
      console.warn("Batch fetch failed, falling back to individual requests");
    }
  }

  for (const filename of filesToRender) {
    try {
      // Use cached content if available, otherwise fetch individually
      let markdownText = paperContents[filename];
      if (!markdownText) {
        const response = await fetch(`/api/papers/${filename}`);
        if (!response.ok) throw new Error(`Could not load ${filename}`);
        const data = await response.json();
        markdownText = data.content;
        paperContents[filename] = markdownText;
      }

      // Calculate reading time before removing content
      const readingTime = getReadingTime(markdownText);

      // Get category
      const category = getCategory(filename);

      // Check if recent
      const meta = paperMetadata[filename];
      const recent = meta && isRecent(meta.mtime);

      // Remove YAML frontmatter (everything between --- delimiters at start)
      if (markdownText.trimStart().startsWith("---")) {
        const yamlEndMatch = markdownText.match(/\n---\s*\n/);
        if (yamlEndMatch) {
          markdownText = markdownText
            .substring(yamlEndMatch.index + yamlEndMatch[0].length)
            .trim();
        }
      }

      // Remove keyword lines from preview
      markdownText = removeKeywordLine(markdownText);

      // Create preview by removing Reference section
      let previewText = markdownText;
      const refIndex = markdownText.indexOf("**Reference:**");
      if (refIndex !== -1) {
        previewText = markdownText.substring(0, refIndex).trim();
      }

      // Remove [Read...] links from preview
      previewText = previewText.replace(/\[Read[^\]]*\]\([^)]*\)/gi, "").trim();

      const article = document.createElement("article");
      article.className = "paper-entry";
      const rawHTML = marked.parse(previewText);
      article.innerHTML = window.DOMPurify
        ? DOMPurify.sanitize(rawHTML)
        : rawHTML;

      // Add category badge and reading time to meta line
      const metaLine = article.querySelector("em");
      if (metaLine) {
        const categoryBadge = `<span class="paper-category"><i class="fas ${category.icon}"></i> ${category.label}</span>`;
        const recentBadge = recent
          ? `<span class="recent-badge"><i class="fas fa-sparkles"></i> New</span>`
          : "";
        metaLine.innerHTML =
          categoryBadge +
          metaLine.innerHTML +
          ` <span class="reading-time"><i class="fas fa-clock"></i> ${readingTime}</span>` +
          recentBadge;
      }

      // Make the H1 title a clickable link
      const title = article.querySelector("h1");
      if (title) {
        const titleText = title.innerHTML;
        title.innerHTML = `<a href="paper.html?file=${encodeURIComponent(
          filename,
        )}" class="paper-title-link">${titleText}</a>`;
      }

      // Wrap content after title and meta for text overflow
      const children = Array.from(article.children);
      const contentWrapper = document.createElement("div");
      contentWrapper.className = "paper-content";

      let skipCount = 0;
      children.forEach((child) => {
        // Skip h1 (title) and first p (meta)
        if (
          skipCount < 2 &&
          (child.tagName === "H1" || child.tagName === "P")
        ) {
          skipCount++;
          return;
        }
        contentWrapper.appendChild(child);
      });

      if (contentWrapper.children.length > 0) {
        article.appendChild(contentWrapper);
      }

      // Add "Read More" link
      const readMoreLink = document.createElement("a");
      readMoreLink.href = `paper.html?file=${encodeURIComponent(filename)}`;
      readMoreLink.className = "read-more";
      readMoreLink.innerHTML = "Read More &rarr;";
      article.appendChild(readMoreLink);

      container.appendChild(article);

      // Render Math (KaTeX)
      if (window.renderMathInElement) {
        renderMathInElement(article, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
          throwOnError: false,
        });
      }
    } catch (error) {
      console.error(error);
      const errorEl = document.createElement("article");
      errorEl.className = "paper-entry paper-error";
      errorEl.innerHTML = `
        <p><i class="fas fa-exclamation-circle"></i> Error loading: ${filename} <br> <small>${error.message}</small></p>
      `;
      container.appendChild(errorEl);
    }
  }
}

// Logic to decide what to show
function updateDisplay(scrollToTop = false) {
  if (filteredPapers.length === 0 && paperFiles.length > 0) {
    // Search returned no results
    updatePaperCount(0, 0);
    renderPapers([]);
    if (viewMoreBtn) viewMoreBtn.style.display = "none";
    if (paginationContainer) paginationContainer.style.display = "none";
    return;
  }

  if (filteredPapers.length === 0) return;

  if (!isFullView && !searchQuery && activeCategory === "all") {
    const initialSet = filteredPapers.slice(0, ITEMS_INITIAL);
    renderPapers(initialSet);
    updatePaperCount(initialSet.length, filteredPapers.length);

    if (filteredPapers.length > ITEMS_INITIAL) {
      viewMoreBtn.style.display = "inline-block";
      paginationContainer.style.display = "none";
    } else {
      viewMoreBtn.style.display = "none";
    }
  } else {
    if (viewMoreBtn) viewMoreBtn.style.display = "none";

    // Show pagination only if not searching or if results > ITEMS_PER_PAGE
    if (filteredPapers.length > ITEMS_PER_PAGE) {
      paginationContainer.style.display = "flex";
    } else {
      paginationContainer.style.display = "none";
    }

    const totalPages = Math.ceil(filteredPapers.length / ITEMS_PER_PAGE);

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageSet = filteredPapers.slice(start, end);

    renderPapers(pageSet);
    updatePaperCount(pageSet.length, filteredPapers.length);

    if (filteredPapers.length > ITEMS_PER_PAGE) {
      renderPaginationControls(totalPages);
    }
  }

  if (scrollToTop) {
    setTimeout(() => {
      const papersSection = document.getElementById("papers");
      if (papersSection) {
        papersSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  }
}

// Render pagination controls
function renderPaginationControls(totalPages) {
  paginationContainer.innerHTML = "";

  const createBtn = (text, pageNum, isActive = false) => {
    const btn = document.createElement("button");
    btn.className = `page-btn ${isActive ? "active" : ""}`;
    btn.textContent = text;
    btn.addEventListener("click", () => {
      currentPage = pageNum;
      updateDisplay(true);
    });
    return btn;
  };

  paginationContainer.appendChild(createBtn("1", 1, currentPage === 1));

  if (totalPages <= 7) {
    for (let i = 2; i <= totalPages; i++) {
      paginationContainer.appendChild(createBtn(i, i, currentPage === i));
    }
  } else {
    if (currentPage > 4) {
      const dots = document.createElement("span");
      dots.className = "page-dots";
      dots.textContent = "...";
      paginationContainer.appendChild(dots);
    }

    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage === 1) endPage = 3;
    if (currentPage === totalPages) startPage = totalPages - 2;

    for (let i = startPage; i <= endPage; i++) {
      paginationContainer.appendChild(createBtn(i, i, currentPage === i));
    }

    if (currentPage < totalPages - 3) {
      const dots = document.createElement("span");
      dots.className = "page-dots";
      dots.textContent = "...";
      paginationContainer.appendChild(dots);
    }

    paginationContainer.appendChild(
      createBtn("Last", totalPages, currentPage === totalPages),
    );
  }
}

// Event Listener for "View More"
if (viewMoreBtn) {
  viewMoreBtn.addEventListener("click", () => {
    isFullView = true;
    currentPage = 1;
    updateDisplay(true);
  });
}

// Search input handler
if (searchInput) {
  let debounceTimer;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value;

    // Show/hide clear button
    if (clearSearchBtn) {
      clearSearchBtn.style.display = query ? "flex" : "none";
    }

    // Debounce search
    debounceTimer = setTimeout(() => {
      isFullView = query.length > 0; // Show all results when searching
      filterPapers(query);
    }, 300);
  });
}

// Clear search button
if (clearSearchBtn) {
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    isFullView = false;
    filterPapers("");
  });
}

// Initialize on Load
document.addEventListener("DOMContentLoaded", loadPaperList);

// --- TIMELINE DRAG TO SCROLL ---
const timelineContainer = document.getElementById("timeline-container");
const timelineHint = document.getElementById("timeline-hint");

if (timelineContainer) {
  let isDown = false;
  let startX;
  let scrollLeft;

  // Edge shadow state management
  const timelineWrapper = timelineContainer.closest(".timeline-wrapper");

  function updateEdgeShadows() {
    if (!timelineWrapper) return;
    const { scrollLeft, scrollWidth, clientWidth } = timelineContainer;
    const atStart = scrollLeft <= 2;
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 2;
    timelineWrapper.classList.toggle("at-start", atStart);
    timelineWrapper.classList.toggle("at-end", atEnd);
  }

  // Set initial shadow state
  updateEdgeShadows();

  timelineContainer.addEventListener("mousedown", (e) => {
    isDown = true;
    timelineContainer.classList.add("dragging");
    startX = e.pageX - timelineContainer.offsetLeft;
    scrollLeft = timelineContainer.scrollLeft;
  });

  timelineContainer.addEventListener("mouseleave", () => {
    isDown = false;
    timelineContainer.classList.remove("dragging");
  });

  timelineContainer.addEventListener("mouseup", () => {
    isDown = false;
    timelineContainer.classList.remove("dragging");
  });

  timelineContainer.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - timelineContainer.offsetLeft;
    const walk = (x - startX) * 2;
    timelineContainer.scrollLeft = scrollLeft - walk;
  });

  // Touch support for mobile
  let touchStartX;
  let touchScrollLeft;

  timelineContainer.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].pageX - timelineContainer.offsetLeft;
      touchScrollLeft = timelineContainer.scrollLeft;
    },
    { passive: true },
  );

  timelineContainer.addEventListener(
    "touchmove",
    (e) => {
      const x = e.touches[0].pageX - timelineContainer.offsetLeft;
      const walk = (x - touchStartX) * 1.5;
      timelineContainer.scrollLeft = touchScrollLeft - walk;
    },
    { passive: true },
  );

  // Hide hint when scrolled to end + update edge shadows
  if (timelineHint) {
    timelineContainer.addEventListener("scroll", () => {
      const { scrollLeft, scrollWidth, clientWidth } = timelineContainer;
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        timelineHint.classList.add("hidden");
      } else {
        timelineHint.classList.remove("hidden");
      }
      updateEdgeShadows();
    });
  } else {
    timelineContainer.addEventListener("scroll", updateEdgeShadows);
  }
}

// --- COPY EMAIL FUNCTIONALITY ---
const copyEmailBtn = document.getElementById("copy-email");
if (copyEmailBtn) {
  copyEmailBtn.addEventListener("click", () => {
    const emailText = document.querySelector(".email-text");
    if (emailText) {
      navigator.clipboard.writeText(emailText.textContent).then(() => {
        // Visual feedback
        copyEmailBtn.classList.add("copied");
        const icon = copyEmailBtn.querySelector("i");
        icon.className = "fas fa-check";

        // Reset after 2 seconds
        setTimeout(() => {
          copyEmailBtn.classList.remove("copied");
          icon.className = "fas fa-copy";
        }, 2000);
      });
    }
  });
}

// --- DYNAMIC FOOTER YEAR ---
const footerYear = document.getElementById("footer-year");
if (footerYear) {
  const currentYear = new Date().getFullYear();
  footerYear.innerHTML = `\u00A9 2024\u2013${currentYear}`;
}
