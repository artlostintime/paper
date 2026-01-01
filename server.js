//Dotenv config
require("dotenv").config();

// Built-in modules
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const PAPERS_DIR = path.join(__dirname, "papers");

// ============== AUTHENTICATION CONFIG ==============
// Set password via environment variable: ADMIN_PASSWORD=yourpassword node server.js
// Or create a .env file with ADMIN_PASSWORD=yourpassword
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

if (ADMIN_PASSWORD === "admin123") {
  console.warn(
    "\n⚠️  WARNING: Using default password! Set ADMIN_PASSWORD environment variable for production.\n"
  );
}

// Session storage (in-memory - resets on server restart)
const sessions = new Map();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting - track failed login attempts by IP
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

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

  if (Date.now() > attempts.lockoutUntil) {
    loginAttempts.delete(ip);
    return false;
  }

  return attempts.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip) {
  const attempts = loginAttempts.get(ip) || { count: 0, lockoutUntil: 0 };
  attempts.count++;

  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockoutUntil = Date.now() + LOCKOUT_TIME;
  }

  loginAttempts.set(ip, attempts);
}

function clearAttempts(ip) {
  loginAttempts.delete(ip);
}

// Generate secure token
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Validate session token
function isValidSession(token) {
  if (!token || !sessions.has(token)) return false;
  const session = sessions.get(token);
  if (Date.now() > session.expires) {
    sessions.delete(token);
    return false;
  }
  return true;
}

// Get token from request (cookie or header)
function getToken(req) {
  // Check Authorization header
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  // Check cookies
  const cookies = req.headers.cookie;
  if (cookies) {
    const match = cookies.match(/admin_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

// Hash password with salt for better security
function hashPassword(password, salt = "") {
  return crypto
    .createHash("sha256")
    .update(password + salt)
    .digest("hex");
}

const PASSWORD_SALT = crypto.randomBytes(16).toString("hex");
const HASHED_PASSWORD = hashPassword(ADMIN_PASSWORD, PASSWORD_SALT);
// ===================================================

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".md": "text/markdown",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

// Send JSON response
function sendJSON(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers - restricted to localhost
  const allowedOrigins = [
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ============== AUTH ENDPOINTS ==============

  // Login endpoint
  if (pathname === "/api/auth/login" && req.method === "POST") {
    const clientIP = getClientIP(req);

    // Check rate limiting
    if (isRateLimited(clientIP)) {
      sendJSON(res, 429, {
        error: "Too many failed attempts. Try again in 15 minutes.",
      });
      return;
    }

    try {
      const { password } = await parseBody(req);

      if (hashPassword(password, PASSWORD_SALT) === HASHED_PASSWORD) {
        clearAttempts(clientIP); // Reset on successful login
        const token = generateToken();
        sessions.set(token, {
          created: Date.now(),
          expires: Date.now() + SESSION_DURATION,
          ip: clientIP,
        });

        // SameSite=Lax allows the cookie to work with normal navigation
        // Not using Secure since this is localhost (HTTP not HTTPS)
        res.setHeader(
          "Set-Cookie",
          `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
            SESSION_DURATION / 1000
          }`
        );
        sendJSON(res, 200, { success: true, token });
      } else {
        recordFailedAttempt(clientIP);
        const attempts = loginAttempts.get(clientIP);
        const remaining = MAX_ATTEMPTS - (attempts?.count || 0);

        // Add delay to slow down brute force
        await new Promise((r) => setTimeout(r, 1000));
        sendJSON(res, 401, {
          error:
            remaining > 0
              ? `Invalid password. ${remaining} attempts remaining.`
              : "Account locked. Try again in 15 minutes.",
        });
      }
    } catch (e) {
      sendJSON(res, 400, { error: "Invalid request" });
    }
    return;
  }

  // Logout endpoint
  if (pathname === "/api/auth/logout" && req.method === "POST") {
    const token = getToken(req);
    if (token) sessions.delete(token);
    res.setHeader("Set-Cookie", "admin_token=; Path=/; HttpOnly; Max-Age=0");
    sendJSON(res, 200, { success: true });
    return;
  }

  // Check auth status
  if (pathname === "/api/auth/check" && req.method === "GET") {
    const token = getToken(req);
    sendJSON(res, 200, { authenticated: isValidSession(token) });
    return;
  }

  // ============== PROTECTED API ROUTES ==============
  // Only POST/PUT/DELETE on /api/papers require authentication
  // GET requests are public (read-only access for the main site)
  if (pathname.startsWith("/api/papers") && req.method !== "GET") {
    const token = getToken(req);
    if (!isValidSession(token)) {
      sendJSON(res, 401, { error: "Unauthorized. Please login." });
      return;
    }
  }

  // API: List papers
  if (pathname === "/api/papers" && req.method === "GET") {
    fs.readdir(PAPERS_DIR, (err, files) => {
      if (err) {
        sendJSON(res, 500, { error: "Could not read papers directory" });
        return;
      }

      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const metadata = {};
      const filesWithStats = [];

      mdFiles.forEach((file) => {
        try {
          const stats = fs.statSync(path.join(PAPERS_DIR, file));
          filesWithStats.push({ name: file, mtime: stats.mtime });
          metadata[file] = { mtime: stats.mtime, size: stats.size };
        } catch (e) {
          filesWithStats.push({ name: file, mtime: new Date(0) });
        }
      });

      filesWithStats.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
      sendJSON(res, 200, {
        files: filesWithStats.map((f) => f.name),
        metadata: metadata,
      });
    });
    return;
  }

  // API: Get paper content
  if (pathname.startsWith("/api/papers/") && req.method === "GET") {
    const filename = decodeURIComponent(pathname.split("/api/papers/")[1]);
    const safeName = path.basename(filename);
    const filePath = path.join(PAPERS_DIR, safeName);

    fs.readFile(filePath, "utf8", (err, content) => {
      if (err) {
        sendJSON(res, 404, { error: "File not found" });
        return;
      }
      sendJSON(res, 200, { content });
    });
    return;
  }

  // API: Save paper
  if (pathname === "/api/papers/save" && req.method === "POST") {
    try {
      const { filename, content } = await parseBody(req);

      if (!filename || !filename.endsWith(".md")) {
        sendJSON(res, 400, { error: "Invalid filename" });
        return;
      }

      const safeName = path.basename(filename);
      const filePath = path.join(PAPERS_DIR, safeName);

      fs.writeFile(filePath, content, "utf8", (err) => {
        if (err) {
          sendJSON(res, 500, { error: "Failed to save file" });
          return;
        }
        sendJSON(res, 200, { success: true, filename: safeName });
      });
    } catch (e) {
      sendJSON(res, 400, { error: "Invalid request body" });
    }
    return;
  }

  // API: Delete paper
  if (pathname === "/api/papers/delete" && req.method === "POST") {
    try {
      const { filename } = await parseBody(req);

      if (!filename) {
        sendJSON(res, 400, { error: "Filename required" });
        return;
      }

      const safeName = path.basename(filename);
      const filePath = path.join(PAPERS_DIR, safeName);

      fs.unlink(filePath, (err) => {
        if (err) {
          sendJSON(res, 500, { error: "Failed to delete file" });
          return;
        }
        sendJSON(res, 200, { success: true });
      });
    } catch (e) {
      sendJSON(res, 400, { error: "Invalid request body" });
    }
    return;
  }

  // ============== STATIC FILES ==============
  let filePath = pathname === "/" ? "/public/index.html" : pathname;

  // Handle /admin route
  if (pathname === "/admin" || pathname === "/admin/") {
    filePath = "/public/admin/index.html";
  }

  // Prefix all non-API paths with /public
  if (!filePath.startsWith("/public/") && !pathname.startsWith("/api/")) {
    filePath = "/public" + filePath;
  }

  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 - File Not Found</h1>");
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Add caching headers for static assets
      const cacheableTypes = [
        ".css",
        ".js",
        ".png",
        ".jpg",
        ".svg",
        ".ico",
        ".woff",
        ".woff2",
      ];
      const headers = { "Content-Type": contentType };
      if (cacheableTypes.includes(ext)) {
        headers["Cache-Control"] = "public, max-age=86400"; // 1 day
      }
      res.writeHead(200, headers);
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Papers directory: ${PAPERS_DIR}`);
  console.log(`🔐 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`\n⚠️  Default password: ${ADMIN_PASSWORD}`);
  console.log(`   Change ADMIN_PASSWORD in server.js for production!\n`);
});
