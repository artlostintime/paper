# 🚀 Getting Started

## Prerequisites

- Node.js (v14 or higher)
- Git

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd port

# Install dependencies (only dotenv needed)
npm install

# Set admin password (optional)
echo "ADMIN_PASSWORD=your_secure_password" > .env
```

## Running the Server

### HTTP (Development)

```bash
node server.js
```

Server runs at: `http://localhost:3000`

### HTTPS (Production)

1. **Generate SSL certificates:**

```bash
mkdir ssl
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj '/CN=localhost'
```

2. **Enable HTTPS:**

```bash
echo "USE_HTTPS=true" >> .env
node server.js
```

Server runs at: `https://localhost:3443`

## Accessing the Site

- **Public Site:** `http://localhost:3000` or `https://localhost:3443`
- **Admin Panel:** `http://localhost:3000/admin` or `https://localhost:3443/admin`
- **Default Password:** `admin123` (change via `.env`)

## Environment Variables

```env
ADMIN_PASSWORD=your_password    # Default: admin123
PORT=3000                       # HTTP port
HTTPS_PORT=3443                 # HTTPS port
USE_HTTPS=true                  # Enable HTTPS
SSL_KEY_PATH=ssl/key.pem       # Optional custom path
SSL_CERT_PATH=ssl/cert.pem     # Optional custom path
```

## Next Steps

- Read the [Admin Guide](ADMIN_GUIDE.md) to learn the admin panel
- Check [Keyboard Shortcuts](SHORTCUTS.md) for productivity tips
- Explore [Features](FEATURES.md) to see what's available
