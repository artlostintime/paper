// Load saved theme
const savedTheme = localStorage.getItem("theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);

// Get paper filename from URL
const params = new URLSearchParams(window.location.search);
const paperFile = params.get("file");

// Store citation data
let currentCitation = "";
let paperTitle = "";
let paperAuthor = "";
let paperYear = "";
let paperJournal = "";
let paperDOI = "";
let paperStatus = "";
let selectedCiteFormat = "apa";

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
    /\*\*References?:\*\*\s*([\s\S]*?)(?=\n\n|\[Read|$)/,
  );
  if (refMatch) {
    return refMatch[1].trim();
  }
  return "";
}

// Extract author and status from meta line (e.g., "_Lead Author • Published 2024_")
function extractMetaInfo(markdown) {
  const metaMatch = markdown.match(/^_(.+?)_$/m);
  if (metaMatch) {
    const meta = metaMatch[1];
    const parts = meta.split("•").map((s) => s.trim());
    return {
      role: parts[0] || "",
      status: parts[1] || "",
    };
  }
  return { role: "", status: "" };
}

// Parse a raw APA-style citation string into structured parts
function parseCitation(rawCitation) {
  if (!rawCitation) return null;

  // Clean markdown italics: _text_ → text
  const cleaned = rawCitation.replace(/_([^_]+)_/g, "$1");

  // Try to match: Author(s). (Year). Title. Journal. Extra. DOI
  const authorMatch = cleaned.match(/^(.+?)\s*\((\d{4})\)\.\s*/);
  if (!authorMatch) return null;

  const author = authorMatch[1].trim();
  const year = authorMatch[2];
  const rest = cleaned.substring(authorMatch[0].length);

  // Extract DOI if present
  const doiMatch = rest.match(/(https?:\/\/doi\.org\/\S+)/);
  const doi = doiMatch ? doiMatch[1] : "";

  // Get the part without DOI
  const withoutDoi = doi ? rest.replace(doi, "").trim() : rest.trim();

  // Split by periods — title is first sentence, journal follows
  // Title ends at the first period followed by a space and then a capitalized word or italic
  const segments = withoutDoi
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let title = segments[0] || "";
  let journal = "";
  let extra = "";

  if (segments.length >= 2) {
    // Try to identify the journal (was originally in italics in raw citation)
    const rawJournalMatch = rawCitation.match(/_([^_]+)_/);
    journal = rawJournalMatch ? rawJournalMatch[1] : segments[1];

    // Remaining segments after title and journal
    const remaining = segments.slice(2).join(". ");
    if (remaining && !remaining.startsWith("http")) {
      extra = remaining.replace(/\.$/, "");
    }
  }

  return { author, year, title, journal, doi, extra };
}

// Generate citation in different formats
function generateCitation(format) {
  const parsed = parseCitation(currentCitation);

  // Fallback: if we can't parse, use raw citation for APA and construct others from metadata
  if (!parsed) {
    if (currentCitation) return currentCitation;
    return `${paperAuthor || "Author"} (${paperYear || "n.d."}). ${paperTitle || "Untitled"}.`;
  }

  const { author, year, title, journal, doi, extra } = parsed;
  const doiStr = doi ? ` ${doi}` : "";
  const extraStr = extra ? ` ${extra}.` : "";

  switch (format) {
    case "apa":
      // APA 7th: Author, A. A. (Year). Title. *Journal*.Extra. DOI
      return `${author} (${year}). ${title}. ${journal ? `_${journal}_.` : ""}${extraStr}${doiStr}`;

    case "mla": {
      // MLA 9th: Author. "Title." *Journal*, Year. DOI.
      const mlaJournal = journal ? `_${journal}_,` : "";
      return `${author}. "${title}." ${mlaJournal} ${year}.${doiStr ? `${doiStr}.` : ""}`;
    }

    case "chicago": {
      // Chicago: Author. "Title." *Journal* (Year).Extra. DOI.
      const chiJournal = journal ? `_${journal}_` : "";
      return `${author}. "${title}." ${chiJournal} (${year}).${extraStr}${doiStr ? `${doiStr}.` : ""}`;
    }

    case "harvard": {
      // Harvard: Author (Year) 'Title', *Journal*.Extra. DOI.
      const harvJournal = journal ? `_${journal}_.` : "";
      return `${author} (${year}) '${title}', ${harvJournal}${extraStr}${doiStr ? `${doiStr}.` : ""}`;
    }

    case "bibtex": {
      // BibTeX
      const key = author.split(",")[0].toLowerCase().replace(/\s/g, "") + year;
      let bib = `@article{${key},\n`;
      bib += `  author    = {${author}},\n`;
      bib += `  title     = {${title}},\n`;
      if (journal) bib += `  journal   = {${journal}},\n`;
      bib += `  year      = {${year}},\n`;
      if (doi)
        bib += `  doi       = {${doi.replace("https://doi.org/", "")}},\n`;
      if (extra) bib += `  note      = {${extra}},\n`;
      bib += `}`;
      return bib;
    }

    default:
      return currentCitation;
  }
}

// Render the cite preview with markdown-style italics converted to HTML
function renderCitePreview(text) {
  return text.replace(/_([^_]+)_/g, "<em>$1</em>");
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
      const yamlEndMatch = markdown.match(/\n---\s*\n/);
      if (yamlEndMatch) {
        markdown = markdown
          .substring(yamlEndMatch.index + yamlEndMatch[0].length)
          .trim();
      }
    }

    // Extract data before parsing
    const keywords = extractKeywords(markdown);
    currentCitation = extractCitation(markdown);
    const readingTime = getReadingTime(markdown);

    // Extract meta info (author role, publication status)
    const metaInfo = extractMetaInfo(markdown);
    paperStatus = metaInfo.status;

    // Remove keyword line from markdown
    markdown = removeKeywordLine(markdown);

    // Parse markdown with XSS sanitization
    let rawHTML = marked.parse(markdown);
    let html = window.DOMPurify ? DOMPurify.sanitize(rawHTML) : rawHTML;

    // Extract title for sharing
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    paperTitle = titleMatch ? titleMatch[1] : "Research Paper";
    document.title = `${paperTitle} | Vishu`;

    // Extract author & year from parsed citation
    const parsed = parseCitation(currentCitation);
    if (parsed) {
      paperAuthor = parsed.author;
      paperYear = parsed.year;
      paperJournal = parsed.journal;
      paperDOI = parsed.doi;
    }

    // Update social share links now that title is available
    document.getElementById("share-twitter").href =
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        window.location.href,
      )}&text=${encodeURIComponent(paperTitle)}`;
    document.getElementById("share-linkedin").href =
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        window.location.href,
      )}`;

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

    // Initialize cite preview with default format
    updateCitePreview();
  } catch (error) {
    console.error("Error loading paper:", error);
    showNotFound();
  }
}

// ── Reading Progress Bar ──────────────────────────

function updateReadingProgress() {
  const progressBar = document.getElementById("reading-progress");
  if (!progressBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (scrollTop / docHeight) * 100;
  progressBar.style.width = `${Math.min(progress, 100)}%`;
}

window.addEventListener("scroll", updateReadingProgress);

// ── Cite Dropdown ─────────────────────────────────

const citeBtn = document.getElementById("copy-citation");
const citeDropdown = document.getElementById("cite-dropdown");
const citePreview = document.getElementById("cite-preview");
const citeCopyBtn = document.getElementById("cite-copy-btn");
const citeFormatBtns = document.querySelectorAll(".cite-format-btn");

function updateCitePreview() {
  if (!citePreview) return;
  const citation = generateCitation(selectedCiteFormat);
  if (citation) {
    citePreview.innerHTML = renderCitePreview(citation);
  } else {
    citePreview.innerHTML =
      '<span class="cite-empty">No citation available for this paper.</span>';
  }
}

// Close all dropdowns
function closeAllDropdowns() {
  if (shareDropdown) shareDropdown.classList.remove("active");
  if (citeDropdown) citeDropdown.classList.remove("active");
}

if (citeBtn) {
  citeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasActive = citeDropdown && citeDropdown.classList.contains("active");
    closeAllDropdowns();
    if (!wasActive && citeDropdown) {
      citeDropdown.classList.toggle("active");
      updateCitePreview();
    }
  });
}

// Format tab switching
citeFormatBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    citeFormatBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCiteFormat = btn.dataset.format;
    updateCitePreview();
  });
});

// Copy the current citation
if (citeCopyBtn) {
  citeCopyBtn.addEventListener("click", () => {
    const citation = generateCitation(selectedCiteFormat);
    if (citation) {
      // For BibTeX, copy raw; for others, strip markdown italics
      const copyText =
        selectedCiteFormat === "bibtex"
          ? citation
          : citation.replace(/_([^_]+)_/g, "$1");
      navigator.clipboard.writeText(copyText).then(() => {
        showToast(`${selectedCiteFormat.toUpperCase()} citation copied!`);
        if (citeDropdown) citeDropdown.classList.remove("active");
      });
    } else {
      showToast("No citation available");
    }
  });
}

// ── Share Dropdown ─────────────────────────────────

const shareBtn = document.getElementById("share-btn");
const shareDropdown = document.getElementById("share-dropdown");

if (shareBtn) {
  shareBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasActive =
      shareDropdown && shareDropdown.classList.contains("active");
    closeAllDropdowns();
    if (!wasActive && shareDropdown) {
      shareDropdown.classList.toggle("active");
    }
  });
}

document.addEventListener("click", () => {
  closeAllDropdowns();
});

// Copy link
const copyLinkBtn = document.getElementById("copy-link");
if (copyLinkBtn) {
  copyLinkBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast("Link copied to clipboard!");
      if (shareDropdown) shareDropdown.classList.remove("active");
    });
  });
}

// ── Print — APA 7th Edition ───────────────────────

const printBtn = document.getElementById("print-btn");
if (printBtn) {
  printBtn.addEventListener("click", () => {
    printAPA7();
  });
}

function printAPA7() {
  // Get the paper content
  const contentEl = document.getElementById("paper-content");
  if (!contentEl) return;

  // Clone content and clean it for print
  const clone = contentEl.cloneNode(true);

  // Remove tags container, buttons, and non-content elements
  clone
    .querySelectorAll(
      ".tags-container, .btn-wrapper, .publication-btn, .reading-time",
    )
    .forEach((el) => el.remove());

  // Extract sections from the content
  const titleEl = clone.querySelector("h1");
  const title = titleEl ? titleEl.textContent : paperTitle;
  if (titleEl) titleEl.remove();

  // Extract author meta line (first <em> is typically "Lead Author • Published 2024")
  const metaEl = clone.querySelector("p > em");
  let authorMeta = "";
  if (metaEl) {
    authorMeta = metaEl.textContent;
    const metaP = metaEl.closest("p");
    if (metaP) metaP.remove();
  }

  // Generate running head (first 50 chars of title, uppercase)
  const runningHead = title.substring(0, 50).toUpperCase();

  // Build APA7-formatted content
  let bodyHTML = clone.innerHTML;

  // Convert heading levels to APA7 format
  // APA7 Level 1: Centered, Bold, Title Case
  // APA7 Level 2: Left-Aligned, Bold, Title Case
  // APA7 Level 3: Left-Aligned, Bold Italic, Title Case
  bodyHTML = bodyHTML
    .replace(/<h2>(.*?)<\/h2>/gi, '<h2 class="apa-heading-1">$1</h2>')
    .replace(/<h3>(.*?)<\/h3>/gi, '<h3 class="apa-heading-2">$1</h3>')
    .replace(/<h4>(.*?)<\/h4>/gi, '<h4 class="apa-heading-3">$1</h4>');

  // Build the complete APA7 document
  const printHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    @page {
      size: letter;
      margin: 1in;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: 2;
      color: #000;
      background: #fff;
    }

    /* Running head + page number */
    @page {
      @top-left {
        content: "${runningHead}";
        font-family: "Times New Roman", Times, serif;
        font-size: 12pt;
      }
      @top-right {
        content: counter(page);
        font-family: "Times New Roman", Times, serif;
        font-size: 12pt;
      }
    }

    .apa-header {
      text-align: left;
      margin-bottom: 0;
      font-size: 12pt;
      font-family: "Times New Roman", Times, serif;
    }

    .apa-running-head {
      font-size: 12pt;
      text-transform: uppercase;
      margin-bottom: 0;
    }

    /* Title page section */
    .apa-title-block {
      text-align: center;
      margin-top: 2in;
      margin-bottom: 2em;
    }

    .apa-title-block h1 {
      font-size: 12pt;
      font-weight: bold;
      line-height: 2;
      margin-bottom: 0;
    }

    .apa-title-block .apa-author {
      font-size: 12pt;
      font-weight: normal;
      line-height: 2;
      margin: 0;
    }

    /* Force page break after title */
    .apa-page-break {
      page-break-after: always;
    }

    /* Body content */
    .apa-body {
      text-indent: 0.5in;
    }

    .apa-body p {
      text-indent: 0.5in;
      margin: 0;
      line-height: 2;
      font-size: 12pt;
    }

    /* APA Heading Levels */
    /* Level 1: Centered, Bold */
    .apa-body h2,
    .apa-body .apa-heading-1 {
      text-align: center;
      font-weight: bold;
      font-size: 12pt;
      line-height: 2;
      margin-top: 0;
      margin-bottom: 0;
      text-indent: 0;
      page-break-after: avoid;
    }

    /* Level 2: Left-Aligned, Bold */
    .apa-body h3,
    .apa-body .apa-heading-2 {
      text-align: left;
      font-weight: bold;
      font-size: 12pt;
      line-height: 2;
      margin-top: 0;
      margin-bottom: 0;
      text-indent: 0;
      page-break-after: avoid;
    }

    /* Level 3: Left-Aligned, Bold Italic */
    .apa-body h4,
    .apa-body .apa-heading-3 {
      text-align: left;
      font-weight: bold;
      font-style: italic;
      font-size: 12pt;
      line-height: 2;
      margin-top: 0;
      margin-bottom: 0;
      text-indent: 0;
      page-break-after: avoid;
    }

    /* Blockquotes — APA7 block quote: indented 0.5in, no quotes */
    .apa-body blockquote {
      margin: 0;
      padding: 0;
      margin-left: 0.5in;
      border: none;
      font-style: normal;
      font-size: 12pt;
      line-height: 2;
    }

    .apa-body blockquote p {
      text-indent: 0;
    }

    /* Lists */
    .apa-body ul, .apa-body ol {
      margin-left: 0.5in;
      margin-top: 0;
      margin-bottom: 0;
      line-height: 2;
    }

    .apa-body li {
      font-size: 12pt;
      line-height: 2;
    }

    /* Tables */
    .apa-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      font-size: 12pt;
    }

    .apa-body th, .apa-body td {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 4pt 8pt;
      text-align: left;
    }

    .apa-body th {
      font-weight: bold;
    }

    /* Code/formulas — keep readable */
    .apa-body pre, .apa-body code {
      font-family: "Courier New", Courier, monospace;
      font-size: 10pt;
    }

    .apa-body pre {
      margin: 0 0.5in;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    /* Strong & emphasis */
    .apa-body strong { font-weight: bold; }
    .apa-body em { font-style: italic; }

    /* References section — APA7 hanging indent */
    .apa-references {
      page-break-before: always;
    }

    .apa-references h2 {
      text-align: center;
      font-weight: bold;
      font-size: 12pt;
      line-height: 2;
      margin-bottom: 0;
    }

    .apa-references p {
      text-indent: -0.5in;
      padding-left: 0.5in;
      margin: 0;
      line-height: 2;
      font-size: 12pt;
    }

    /* Links: display URL inline, no special styling */
    a {
      color: #000;
      text-decoration: none;
    }

    /* KaTeX: ensure it prints */
    .katex { font-size: 1em; }

    /* Images */
    img {
      max-width: 100%;
      page-break-inside: avoid;
    }

    /* Prevent orphans/widows */
    p, blockquote, li {
      orphans: 2;
      widows: 2;
    }

    /* Hide non-print elements */
    .tags-container,
    .btn-wrapper,
    .publication-btn,
    .reading-time {
      display: none !important;
    }
  </style>
</head>
<body>
  <!-- Title Page -->
  <div class="apa-title-block">
    <h1>${title}</h1>
    <p class="apa-author">${authorMeta || ""}</p>
  </div>
  <div class="apa-page-break"></div>

  <!-- Running head on content pages -->
  <div class="apa-body">
    ${bodyHTML}
  </div>

  ${
    currentCitation
      ? `
  <div class="apa-references">
    <h2>References</h2>
    <p>${currentCitation.replace(/_([^_]+)_/g, "<em>$1</em>")}</p>
  </div>`
      : ""
  }
</body>
</html>`;

  // Open print window
  const printWindow = window.open("", "_blank", "width=816,height=1056");
  printWindow.document.write(printHTML);
  printWindow.document.close();

  // Wait for content (including KaTeX CSS) to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
}

// Initialize
loadPaper();
