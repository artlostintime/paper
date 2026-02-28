// Dotenv config
require("dotenv").config();

// Dependencies
const express = require("express");
const https = require("https");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const matter = require("gray-matter");

// ============== CONFIG ==============
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const USE_HTTPS = process.env.USE_HTTPS === "true";
const PAPERS_DIR = path.join(__dirname, "papers");
const BCRYPT_ROUNDS = 12;
const VALID_FILENAME = /^[\w-]+\.md$/;

// ============== AUTHENTICATION CONFIG ==============
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

if (ADMIN_PASSWORD === "admin123") {
  console.warn(
    "\n⚠️  WARNING: Using default password! Set ADMIN_PASSWORD environment variable for production.\n",
  );
}

// Hash password at startup with bcrypt
let hashedPassword = null;
(async () => {
  hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  console.log("✅ Password hashed with bcrypt");
})();

// Session storage (in-memory — intentional)
const sessions = new Map();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting — track failed login attempts by IP
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// ============== HELPER FUNCTIONS ==============

function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function isRateLimited(ip) {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return false;
  if (attempts.count >= MAX_ATTEMPTS) {
    if (attempts.lockoutUntil > 0 && Date.now() >= attempts.lockoutUntil) {
      loginAttempts.delete(ip);
      return false;
    }
    return true;
  }
  return false;
}

function recordFailedAttempt(ip) {
  const attempts = loginAttempts.get(ip) || { count: 0, lockoutUntil: 0 };
  attempts.count++;
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockoutUntil = Date.now() + LOCKOUT_TIME;
  }
  loginAttempts.set(ip, attempts);
  return attempts;
}

function clearAttempts(ip) {
  loginAttempts.delete(ip);
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function isValidSession(token) {
  if (!token || !sessions.has(token)) return false;
  const session = sessions.get(token);
  if (Date.now() > session.expires) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function getToken(req) {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  if (req.cookies && req.cookies.admin_token) {
    return req.cookies.admin_token;
  }
  return null;
}

// Category file mapping (single source of truth — served via /api/categories)
const CATEGORY_MAP = {
  clinical: {
    icon: "fa-user-md",
    label: "Clinical",
    files: ["anxiety", "depression", "psychotherapy", "trauma"],
  },
  cognitive: {
    icon: "fa-brain",
    label: "Cognitive",
    files: ["cognition", "memory"],
  },
  social: {
    icon: "fa-users",
    label: "Social",
    files: ["social", "attachment"],
  },
  health: {
    icon: "fa-heartbeat",
    label: "Health",
    files: ["burnout", "sleep", "addiction"],
  },
  developmental: {
    icon: "fa-child",
    label: "Developmental",
    files: ["developmental"],
  },
  neuroscience: {
    icon: "fa-dna",
    label: "Neuroscience",
    files: ["neuroscience"],
  },
  personality: {
    icon: "fa-fingerprint",
    label: "Personality",
    files: ["personality", "motivation"],
  },
};

function getCategoryFiles(category) {
  return CATEGORY_MAP[category]?.files || [];
}

// Helper: get category key for a filename
function getFileCategory(filename) {
  const baseName = filename.replace(".md", "").toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (value.files.some((f) => baseName.includes(f))) {
      return key;
    }
  }
  return "other";
}

// ============== IN-MEMORY SEARCH INDEX ==============
let searchIndex = new Map(); // filename → { content, mtime }

async function buildSearchIndex() {
  try {
    const files = await fsPromises.readdir(PAPERS_DIR);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    for (const file of mdFiles) {
      try {
        const filePath = path.join(PAPERS_DIR, file);
        const [content, stats] = await Promise.all([
          fsPromises.readFile(filePath, "utf8"),
          fsPromises.stat(filePath),
        ]);
        searchIndex.set(file, {
          content: content.toLowerCase(),
          raw: content,
          mtime: stats.mtime,
          size: stats.size,
        });
      } catch (e) {
        // Skip unreadable files
      }
    }
    console.log(`✅ Search index built (${searchIndex.size} papers)`);
  } catch (e) {
    console.error("❌ Failed to build search index:", e.message);
  }
}

// Rebuild index on file changes
function invalidateIndex(filename) {
  const filePath = path.join(PAPERS_DIR, filename);
  fsPromises
    .readFile(filePath, "utf8")
    .then(async (content) => {
      const stats = await fsPromises.stat(filePath);
      searchIndex.set(filename, {
        content: content.toLowerCase(),
        raw: content,
        mtime: stats.mtime,
        size: stats.size,
      });
    })
    .catch(() => {
      searchIndex.delete(filename);
    });
}

// Build index on startup
buildSearchIndex();

// ============== FILE WATCHER ==============
// Auto-rebuild search index when papers change on disk (e.g. git pull)
try {
  fs.watch(PAPERS_DIR, { persistent: false }, (eventType, filename) => {
    if (filename && filename.endsWith('.md')) {
      invalidateIndex(filename);
    }
  });
  console.log('👁️  Watching papers directory for changes');
} catch (e) {
  console.warn('⚠️  Could not watch papers directory:', e.message);
}

// ============== SESSION & RATE-LIMIT CLEANUP ==============
// Prune expired sessions and stale login attempts every 30 minutes
setInterval(() => {
  const now = Date.now();
  let sessionsPruned = 0;
  let attemptsPruned = 0;

  for (const [token, session] of sessions) {
    if (now > session.expires) {
      sessions.delete(token);
      sessionsPruned++;
    }
  }

  for (const [ip, attempts] of loginAttempts) {
    if (attempts.lockoutUntil > 0 && now >= attempts.lockoutUntil) {
      loginAttempts.delete(ip);
      attemptsPruned++;
    }
  }

  if (sessionsPruned || attemptsPruned) {
    console.log(`🧹 Cleanup: ${sessionsPruned} expired sessions, ${attemptsPruned} stale lockouts removed`);
  }
}, 30 * 60 * 1000);

// ============== EXPRESS APP ==============
const app = express();

// --- Middleware ---
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(compression());

// Helmet — security headers with proper CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://fonts.googleapis.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
        ],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS — restricted to localhost
app.use(
  cors({
    origin: [
      `http://localhost:${PORT}`,
      `http://127.0.0.1:${PORT}`,
      `https://localhost:${HTTPS_PORT}`,
      `https://127.0.0.1:${HTTPS_PORT}`,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// HSTS for HTTPS
if (USE_HTTPS) {
  app.use((req, res, next) => {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
    next();
  });
}

// ============== CSRF PROTECTION ==============
// Simple origin-check middleware for state-changing requests
function csrfCheck(req, res, next) {
  if (
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS"
  ) {
    return next();
  }

  const origin = req.headers["origin"];
  const referer = req.headers["referer"];
  const allowed = [
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
    `https://localhost:${HTTPS_PORT}`,
    `https://127.0.0.1:${HTTPS_PORT}`,
  ];

  // Allow requests with no origin (same-origin form submits, curl, etc.)
  if (!origin && !referer) {
    return next();
  }

  const requestOrigin = origin || new URL(referer).origin;
  if (allowed.some((a) => requestOrigin === a)) {
    return next();
  }

  return res.status(403).json({ error: "Forbidden: invalid origin" });
}

app.use(csrfCheck);

// ============== AUTH MIDDLEWARE ==============
function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!isValidSession(token)) {
    return res.status(401).json({ error: "Unauthorized. Please login." });
  }
  next();
}

// ============== AUTH ROUTES ==============

app.post("/api/auth/login", async (req, res) => {
  const clientIP = getClientIP(req);

  if (isRateLimited(clientIP)) {
    return res
      .status(429)
      .json({ error: "Too many failed attempts. Try again in 15 minutes." });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }

    // Wait for hash to be ready (only on very first request after startup)
    if (!hashedPassword) {
      hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
    }

    const isMatch = await bcrypt.compare(password, hashedPassword);

    if (isMatch) {
      clearAttempts(clientIP);
      const token = generateToken();
      sessions.set(token, {
        created: Date.now(),
        expires: Date.now() + SESSION_DURATION,
        ip: clientIP,
      });

      res.cookie("admin_token", token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: SESSION_DURATION,
        secure: USE_HTTPS,
      });

      return res.json({ success: true, token });
    } else {
      const attempts = recordFailedAttempt(clientIP);
      const remaining = MAX_ATTEMPTS - attempts.count;

      await new Promise((r) => setTimeout(r, 1000));
      return res.status(401).json({
        error:
          remaining > 0
            ? `Invalid password. ${remaining} attempts remaining.`
            : "Account locked. Try again in 15 minutes.",
      });
    }
  } catch (e) {
    console.error("Login error:", e);
    return res.status(400).json({ error: "Invalid request" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  const token = getToken(req);
  if (token) sessions.delete(token);
  res.clearCookie("admin_token", { path: "/", httpOnly: true });
  res.json({ success: true });
});

app.get("/api/auth/check", (req, res) => {
  const token = getToken(req);
  res.json({ authenticated: isValidSession(token) });
});

// ============== SHARED DATA ==============

// Serve the category map so frontend doesn't need its own copy
app.get("/api/categories", (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  res.json(CATEGORY_MAP);
});

// ============== PAPER ROUTES ==============

// List papers (fully async, with sorting)
app.get("/api/papers", async (req, res) => {
  const sort = (req.query.sort || "date").toLowerCase(); // date | name | category

  try {
    const files = await fsPromises.readdir(PAPERS_DIR);
    const mdFiles = files.filter((f) => f.endsWith(".md"));
    const metadata = {};
    const filesWithStats = [];

    await Promise.all(
      mdFiles.map(async (file) => {
        try {
          const stats = await fsPromises.stat(path.join(PAPERS_DIR, file));
          filesWithStats.push({
            name: file,
            mtime: stats.mtime,
            size: stats.size,
          });
          metadata[file] = { mtime: stats.mtime, size: stats.size };
        } catch (e) {
          filesWithStats.push({ name: file, mtime: new Date(0), size: 0 });
        }
      }),
    );

    // Sort based on query param
    switch (sort) {
      case "name":
        filesWithStats.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "category":
        filesWithStats.sort((a, b) => {
          const catA = getFileCategory(a.name);
          const catB = getFileCategory(b.name);
          return catA.localeCompare(catB) || a.name.localeCompare(b.name);
        });
        break;
      case "date":
      default:
        filesWithStats.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
        break;
    }

    res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
    res.json({
      files: filesWithStats.map((f) => f.name),
      metadata,
    });
  } catch (err) {
    return res.status(500).json({ error: "Could not read papers directory" });
  }
});

// Batch preview endpoint — fetch multiple papers in one request
app.get("/api/papers/batch", async (req, res) => {
  const fileList = req.query.files;
  if (!fileList) {
    return res.status(400).json({ error: "files query parameter required" });
  }

  const filenames = fileList.split(",").map((f) => f.trim());
  const results = {};

  await Promise.all(
    filenames.map(async (filename) => {
      if (!VALID_FILENAME.test(filename)) return;
      const safeName = path.basename(filename);
      const filePath = path.join(PAPERS_DIR, safeName);

      try {
        const content = await fsPromises.readFile(filePath, "utf8");
        const { data: frontmatter, content: markdownContent } = matter(content);
        results[safeName] = { content: markdownContent, frontmatter };
      } catch (e) {
        // Skip missing files
      }
    }),
  );

  res.json(results);
});

// Search papers (uses in-memory index — no disk reads per request)
app.get("/api/papers/search", (req, res) => {
  const query = (req.query.q || "").toLowerCase().trim();
  const category = (req.query.category || "all").toLowerCase().trim();

  if (!query && category === "all") {
    return res.status(400).json({ error: "Search query or category required" });
  }

  const results = [];

  for (const [file, entry] of searchIndex) {
    // Category filter by filename
    if (category !== "all") {
      const baseName = file.replace(".md", "").toLowerCase();
      const categoryFiles = getCategoryFiles(category);
      if (!categoryFiles.some((f) => baseName.includes(f))) {
        continue;
      }
    }

    // Content search using cached index
    if (query) {
      if (!entry.content.includes(query)) {
        continue;
      }
    }

    results.push(file);
  }

  res.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=15');
  res.json({ files: results });
});

// Get paper content (AFTER /search and /batch to avoid route conflict)
app.get("/api/papers/:filename", async (req, res) => {
  const safeName = path.basename(req.params.filename);

  // Strict filename validation
  if (!VALID_FILENAME.test(safeName)) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  const filePath = path.join(PAPERS_DIR, safeName);

  try {
    const content = await fsPromises.readFile(filePath, "utf8");
    const { data: frontmatter, content: markdownContent } = matter(content);
    res.json({ content: markdownContent, frontmatter, raw: content });
  } catch (err) {
    return res.status(404).json({ error: "File not found" });
  }
});

// Save paper (auth required)
app.post("/api/papers/save", requireAuth, async (req, res) => {
  const { filename, content } = req.body;

  if (!filename || !filename.endsWith(".md")) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  // Strict filename validation
  const safeName = path.basename(filename);
  if (!VALID_FILENAME.test(safeName)) {
    return res.status(400).json({
      error:
        "Invalid filename. Use only letters, numbers, hyphens, and underscores.",
    });
  }

  const filePath = path.join(PAPERS_DIR, safeName);

  try {
    await fsPromises.writeFile(filePath, content, "utf8");
    invalidateIndex(safeName); // Update search index
    res.json({ success: true, filename: safeName });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save file" });
  }
});

// Delete paper (auth required)
app.post("/api/papers/delete", requireAuth, async (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: "Filename required" });
  }

  const safeName = path.basename(filename);
  if (!VALID_FILENAME.test(safeName)) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  const filePath = path.join(PAPERS_DIR, safeName);

  try {
    await fsPromises.unlink(filePath);
    invalidateIndex(safeName); // Remove from search index
    res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete file" });
  }
});

// ============== STATIC FILES ==============

// Admin panel
app.use(
  "/admin",
  express.static(path.join(__dirname, "public", "admin"), {
    maxAge: "1d",
    index: "index.html",
  }),
);

// Public files
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: "1d",
  }),
);

// ============== 404 HANDLER ==============
app.use((req, res) => {
  // For API routes, return JSON
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }

  // For HTML requests, serve a themed 404 page
  res.status(404).send(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 | Not Found</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧠</text></svg>">
  <link rel="stylesheet" href="/css/main.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
  <main id="main-content">
    <div class="paper-not-found">
      <i class="fas fa-compass"></i>
      <h1>404 — Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" class="btn-back"><i class="fas fa-arrow-left"></i> Back to Home</a>
    </div>
  </main>
  <script src="/js/theme-init.js"></script>
</body>
</html>`);
});

// ============== GLOBAL ERROR HANDLER ==============
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);

  if (req.path.startsWith("/api/")) {
    return res.status(500).json({ error: "Internal server error" });
  }

  res.status(500).send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Error</title></head>
<body style="font-family: sans-serif; text-align: center; padding: 4rem;">
  <h1>Something went wrong</h1>
  <p>Please try again later.</p>
  <a href="/">Back to Home</a>
</body></html>`);
});

// ============== SERVER CREATION ==============

if (USE_HTTPS) {
  const keyPath =
    process.env.SSL_KEY_PATH || path.join(__dirname, "ssl", "key.pem");
  const certPath =
    process.env.SSL_CERT_PATH || path.join(__dirname, "ssl", "cert.pem");

  let httpsOptions;
  try {
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    console.log("✅ SSL certificates loaded");
  } catch (error) {
    console.error("❌ Failed to load SSL certificates:", error.message);
    console.log(
      "\n📝 Generate certificates with:\n   openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj '/CN=localhost'\n",
    );
    process.exit(1);
  }

  const httpsServer = https.createServer(httpsOptions, app);
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`\n🔒 HTTPS Server running at https://localhost:${HTTPS_PORT}`);
    console.log(`📁 Papers directory: ${PAPERS_DIR}`);
    console.log(`🔐 Admin panel: https://localhost:${HTTPS_PORT}/admin`);
    console.log(
      `\n⚠️  Using self-signed certificate — browsers will show warning\n`,
    );
  });

  // HTTP → HTTPS redirect
  const http = require("http");
  const redirectApp = express();
  redirectApp.all("*", (req, res) => {
    res.redirect(
      301,
      `https://${req.headers.host.replace(PORT, HTTPS_PORT)}${req.url}`,
    );
  });
  http.createServer(redirectApp).listen(PORT, () => {
    console.log(`↪️  HTTP→HTTPS redirect on http://localhost:${PORT}\n`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📁 Papers directory: ${PAPERS_DIR}`);
    console.log(`🔐 Admin panel: http://localhost:${PORT}/admin`);
  });
}
