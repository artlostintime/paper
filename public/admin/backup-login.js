// Backup login handler — works even if admin.js fails to load
(function () {
  var loginForm = document.getElementById("login-form");
  if (loginForm && !loginForm._hasHandler) {
    loginForm._hasHandler = true;
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var pwd = document.getElementById("login-password");
      var err = document.getElementById("login-error");
      var btn = loginForm.querySelector("button[type=submit]");

      if (!pwd || !pwd.value) {
        if (err) err.textContent = "Please enter password";
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      }

      try {
        var res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ password: pwd.value }),
        });
        var data = await res.json();

        if (data.success) {
          document.getElementById("login-screen").style.display = "none";
          document.getElementById("admin-app").style.display = "block";
          if (typeof loadPapers === "function") loadPapers();
        } else {
          if (err) err.textContent = data.error || "Invalid password";
        }
      } catch (ex) {
        console.error("Login error:", ex);
        if (err) err.textContent = "Connection error";
      }

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      }
    });
  }
})();
