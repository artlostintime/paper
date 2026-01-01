// test-security.js - IMPROVED VERSION with proper test isolation

const crypto = require("crypto");
const http = require("http");

const BASE_URL = "http://localhost:3000";

async function request(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + endpoint);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: JSON.parse(data),
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data,
            });
          }
        });
      }
    );

    req.on("error", reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function testSecurity() {
  console.log("🔐 Security Test Suite\n");

  // Test 1: HttpOnly Cookie & Valid Login (BEFORE rate limiting test!)
  console.log("1️⃣  Testing Valid Login & HttpOnly Cookie...");
  const loginRes = await request("/api/auth/login", {
    method: "POST",
    body: { password: "admin123" },
  });

  console.log(
    "   Login status:",
    loginRes.status === 200 ? "✅ Success" : "❌ Failed"
  );
  console.log("   Response:", loginRes.body);

  const setCookie = loginRes.headers["set-cookie"]?.[0];
  console.log("   Set-Cookie:", setCookie ? "✅ Present" : "❌ Missing");

  if (setCookie) {
    console.log(
      "   HttpOnly flag:",
      setCookie.includes("HttpOnly") ? "✅" : "❌"
    );
    console.log(
      "   SameSite flag:",
      setCookie.includes("SameSite") ? "✅" : "❌"
    );
  }

  console.log(
    "   Token length:",
    loginRes.body.token?.length || "NO TOKEN",
    loginRes.body.token?.length === 64 ? "✅" : "❌"
  );

  // Small delay
  await new Promise((r) => setTimeout(r, 1500));

  // Test 2: Rate Limiting
  console.log("\n2️⃣  Testing Rate Limiting...");
  console.log(
    "   (Note: Requires server restart to clear previous attempts)\n"
  );

  for (let i = 1; i <= 7; i++) {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: { password: "wrong" + i },
    });
    console.log(
      `   Attempt ${i}: [${res.status}] ${res.body.error || res.body.success}`
    );

    // Wait for server's delay (1000ms) plus buffer
    if (i < 7) await new Promise((r) => setTimeout(r, 1200));
  }

  // Test 3: Path Traversal
  console.log("\n3️⃣  Testing Path Traversal Protection...");
  const attacks = [
    "../server.js",
    "../../package.json",
    "../.env",
    "../../.gitignore",
  ];
  for (const attack of attacks) {
    const res = await request(`/api/papers/${encodeURIComponent(attack)}`);
    console.log(
      `   Attack "${attack}": ${
        res.status === 404
          ? "✅ Blocked"
          : "❌ VULNERABLE (status: " + res.status + ")"
      }`
    );
  }

  // Test 4: Valid Paper Access
  console.log("\n4️⃣  Testing Valid Paper Access...");
  const validRes = await request("/api/papers/burnout.md");
  console.log(
    "   Access burnout.md:",
    validRes.status === 200
      ? "✅ Success"
      : "❌ Failed (status: " + validRes.status + ")"
  );

  console.log("\n✅ Security tests complete!");
  console.log(
    "\n💡 Note: To fully test rate limiting, restart the server and run again."
  );
}

// Run if server is running
testSecurity().catch(console.error);
