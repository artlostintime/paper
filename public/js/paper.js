// Load saved theme
const savedTheme = localStorage.getItem("theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);

// Get paper filename from URL
const params = new URLSearchParams(window.location.search);
const paperFile = params.get("file");

// Store citation for copy functionality
let currentCitation = "";
let paperTitle = "";

// Toast notification
function showToast(message, duration = 2000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

// Show 404 error
function showNotFound() {
  const container = document.getElementById("paper-content");
  document.title = "Paper Not Found | Vishu";

  // Hide header actions
  document.querySelector(".paper-actions").style.display = "none";

  container.innerHTML = `
    <div class="paper-not-found">
      <i class="fas fa-file-circle-exclamation"></i>
      <h1>Paper Not Found</h1>
      <p>Sorry, we couldn't find the paper you're looking for. It may have been moved or deleted.</p>
      <a href="index.html" class="btn-back">
        <i class="fas fa-arrow-left"></i> Back to Papers
      </a>
    </div>
  `;
}

// Extract keywords from markdown (max 5)
function extractKeywords(text) {
  const keywordRegex = /#[\w-]+/g;
  const matches = text.match(keywordRegex) || [];
  return matches.slice(0, 5);
}

// Remove keyword line from markdown
function removeKeywordLine(text) {
  return text.replace(/^#[\w-]+(\s+#[\w-]+)*\s*$/gm, "").trim();
}

// Extract citation from reference section
function extractCitation(text) {
  const refMatch = text.match(
    /\*\*Reference:\*\*\s*([\s\S]*?)(?=\n\n|\[Read|$)/,
  );
  if (refMatch) {
    return refMatch[1].trim();
  }
  return "";
}

// Create tags HTML
function createTagsHTML(keywords) {
  if (keywords.length === 0) return "";
  const tagsHTML = keywords
    .map(
      (tag) =>
        `<a href="index.html?tag=${encodeURIComponent(
          tag.substring(1),
        )}" class="tag">${tag}</a>`,
    )
    .join("");
  return `<div class="tags-container">${tagsHTML}</div>`;
}

// Reading time calculator
function getReadingTime(text) {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

async function loadPaper() {
  const container = document.getElementById("paper-content");

  if (!paperFile) {
    showNotFound();
    return;
  }

  // Validate filename (security)
  if (!/^[\w-]+\.md$/.test(paperFile)) {
    showNotFound();
    return;
  }

  try {
    const response = await fetch(`/api/papers/${paperFile}`);
    if (!response.ok) {
      showNotFound();
      return;
    }

    const data = await response.json();
    let markdown = data.content;

    // Remove YAML frontmatter (everything between --- delimiters at start)
    if (markdown.trimStart().startsWith("---")) {
      const yamlEndIndex = markdown.indexOf("\n---", 4);
      if (yamlEndIndex !== -1) {
        markdown = markdown.substring(yamlEndIndex + 4).trim();
      }
    }

    // Extract data before parsing
    const keywords = extractKeywords(markdown);
    currentCitation = extractCitation(markdown);
    const readingTime = getReadingTime(markdown);

    // Remove keyword line from markdown
    markdown = removeKeywordLine(markdown);

    // Parse markdown with XSS sanitization
    let rawHTML = marked.parse(markdown);
    let html = window.DOMPurify ? DOMPurify.sanitize(rawHTML) : rawHTML;

    // Extract title for sharing
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    paperTitle = titleMatch ? titleMatch[1] : "Research Paper";
    document.title = `${paperTitle} | Vishu`;

    // Add reading time to meta line
    html = html.replace(
      /(<em>.*?<\/em>)/,
      `$1 <span class="reading-time"><i class="fas fa-clock"></i> ${readingTime}</span>`,
    );

    // Wrap publication link in button wrapper
    html = html.replace(
      /<a href="(https:\/\/doi\.org[^"]*)"[^>]*>Read Full Article<\/a>/gi,
      '<div class="btn-wrapper"><a href="$1" class="publication-btn" target="_blank" rel="noopener">Read Full Article <i class="fas fa-external-link-alt"></i></a></div>',
    );

    // Add tags at the top
    const tagsHTML = createTagsHTML(keywords);

    container.innerHTML = tagsHTML + html;

    // Render KaTeX
    if (window.renderMathInElement) {
      renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
      });
    }
  } catch (error) {
    console.error("Error loading paper:", error);
    showNotFound();
  }
}

// Reading progress bar
function updateReadingProgress() {
  const progressBar = document.getElementById("reading-progress");
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (scrollTop / docHeight) * 100;
  progressBar.style.width = `${Math.min(progress, 100)}%`;
}

window.addEventListener("scroll", updateReadingProgress);

// Copy citation button
document.getElementById("copy-citation").addEventListener("click", () => {
  if (currentCitation) {
    navigator.clipboard.writeText(currentCitation).then(() => {
      showToast("Citation copied to clipboard!");
    });
  } else {
    showToast("No citation available");
  }
});

// Share functionality
const shareBtn = document.getElementById("share-btn");
const shareDropdown = document.getElementById("share-dropdown");

shareBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  shareDropdown.classList.toggle("show");
});

document.addEventListener("click", () => {
  shareDropdown.classList.remove("show");
});

// Copy link
document.getElementById("copy-link").addEventListener("click", () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    showToast("Link copied to clipboard!");
    shareDropdown.classList.remove("show");
  });
});

// Social share links
document.getElementById("share-twitter").href =
  `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    window.location.href,
  )}&text=${encodeURIComponent(paperTitle)}`;
document.getElementById("share-linkedin").href =
  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    window.location.href,
  )}`;

// Print button
document.getElementById("print-btn").addEventListener("click", () => {
  window.print();
});

// Initialize
loadPaper();
