# 🔌 API Reference

## Authentication Endpoints

### POST /api/auth/login

Login to admin panel.

**Request:**

```json
{
  "password": "your_password"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "token": "64-char-hex-token"
}
```

**Sets Cookie:**

```
admin_token=<token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400
```

**Error Responses:**

- `401` - Invalid password
- `429` - Too many failed attempts (locked for 15 minutes)

---

### POST /api/auth/logout

Logout from admin panel.

**Response (200):**

```json
{
  "success": true
}
```

**Clears Cookie:**

```
admin_token=; Path=/; HttpOnly; Max-Age=0
```

---

### GET /api/auth/check

Check authentication status.

**Response (200):**

```json
{
  "authenticated": true
}
```

---

## Paper Endpoints

### GET /api/papers

List all papers (public endpoint).

**Response (200):**

```json
{
  "files": ["burnout.md", "anxiety.md", "cognition.md"],
  "metadata": {
    "burnout.md": {
      "mtime": "2026-01-02T12:34:56.789Z",
      "size": 1234
    }
  }
}
```

**Notes:**

- Files sorted by modification time (newest first)
- Metadata includes last modified time and file size

---

### GET /api/papers/:filename

Get paper content (public endpoint).

**Parameters:**

- `filename` - Paper filename (e.g., `burnout.md`)

**Success Response (200):**

```json
{
  "content": "# Paper Title\n\n*Author...*"
}
```

**Error Response:**

- `404` - File not found

---

### POST /api/papers/save

Save or update a paper (requires authentication).

**Request:**

```json
{
  "filename": "my-paper.md",
  "content": "# Paper Title\n\n*Author...*"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "filename": "my-paper.md"
}
```

**Error Responses:**

- `400` - Invalid filename (must end with `.md`)
- `401` - Unauthorized (not logged in)
- `500` - Failed to save file

---

### POST /api/papers/delete

Delete a paper (requires authentication).

**Request:**

```json
{
  "filename": "my-paper.md"
}
```

**Success Response (200):**

```json
{
  "success": true
}
```

**Error Responses:**

- `400` - Filename required
- `401` - Unauthorized (not logged in)
- `500` - Failed to delete file

---

## Rate Limiting

**Login Endpoint:**

- Max 5 failed attempts per IP
- 15-minute lockout after max attempts
- Resets on successful login

---

## Authentication

### Protected Routes

Only the following require authentication:

- `POST /api/papers/save`
- `POST /api/papers/delete`

All GET endpoints are public (read-only access).

### Token Validation

Tokens are validated from:

1. `Authorization: Bearer <token>` header
2. `admin_token` cookie

Sessions expire after 24 hours.

---

## Error Handling

All endpoints return JSON errors:

```json
{
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## CORS

**Allowed Origins:**

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `https://localhost:3443`
- `https://127.0.0.1:3443`

**Allowed Methods:**

- GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:**

- Content-Type, Authorization

**Credentials:**

- Enabled (cookies allowed)

---

## Security Headers

All responses include:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

HTTPS responses include:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Example Usage

### JavaScript Fetch

```javascript
// Login
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "same-origin",
  body: JSON.stringify({ password: "admin123" }),
});
const data = await response.json();

// Get papers
const papers = await fetch("/api/papers");
const { files, metadata } = await papers.json();

// Save paper (requires auth)
await fetch("/api/papers/save", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "same-origin",
  body: JSON.stringify({
    filename: "my-paper.md",
    content: "# Title\n\nContent...",
  }),
});
```
