import auth from "./auth.js"; // Make sure to convert options.js to a module

document.addEventListener("DOMContentLoaded", async function () {
  // Display the redirect URI
  const redirectUri = chrome.identity.getRedirectURL();
  document.getElementById("redirectUri").textContent = redirectUri;

  // Add copy functionality
  document
    .getElementById("copyRedirect")
    .addEventListener("click", function () {
      navigator.clipboard.writeText(redirectUri).then(() => {
        this.textContent = "Copied!";
        setTimeout(() => {
          this.textContent = "Copy";
        }, 2000);
      });
    });

  // Load saved settings
  chrome.storage.sync.get(
    ["apiUrl", "clientId", "userId", "ticketTypeId"],
    function (items) {
      document.getElementById("apiUrl").value = items.apiUrl || "";
      document.getElementById("clientId").value = items.clientId || "";
      document.getElementById("userId").value = items.userId || "";
      document.getElementById("ticketTypeId").value = items.ticketTypeId || "";
    },
  );

  document.getElementById("save").addEventListener("click", function () {
    const apiUrl = document.getElementById("apiUrl").value.trim();
    const clientId = document.getElementById("clientId").value.trim();
    const userId = document.getElementById("userId").value.trim();
    const ticketTypeId = document.getElementById("ticketTypeId").value.trim();

    // Basic validation
    if (!apiUrl || !clientId || !userId || !ticketTypeId) {
      const status = document.getElementById("status");
      status.textContent = "All fields are required";
      status.className = "error";
      return;
    }

    if (!validateApiUrl(apiUrl)) {
      const status = document.getElementById("status");
      status.textContent = "Invalid API URL format";
      status.className = "error";
      return;
    }

    // Save to chrome.storage
    chrome.storage.sync.set(
      {
        apiUrl: apiUrl,
        clientId: clientId,
        userId: userId,
        ticketTypeId: ticketTypeId,
      },
      function () {
        const status = document.getElementById("status");
        status.textContent = "Settings saved successfully!";
        status.className = "success";

        setTimeout(function () {
          status.textContent = "";
        }, 2000);
      },
    );
  });

  // Add test login handler
  document
    .getElementById("testLogin")
    .addEventListener("click", async function () {
      const loginStatus = document.getElementById("loginStatus");
      try {
        loginStatus.textContent = "Attempting to login...";
        loginStatus.className = "";

        const token = await auth.getAuthToken();
        loginStatus.textContent =
          "Login successful! You can now use the extension.";
        loginStatus.className = "success";
      } catch (error) {
        loginStatus.textContent = `Login failed: ${error.message}`;
        loginStatus.className = "error";
      }
    });

  // Add sign out handler
  document
    .getElementById("signOut")
    .addEventListener("click", async function () {
      try {
        await auth.signOut();
        const loginStatus = document.getElementById("loginStatus");
        loginStatus.textContent = "Signed out successfully";
        loginStatus.className = "success";
      } catch (error) {
        loginStatus.textContent = `Sign out failed: ${error.message}`;
        loginStatus.className = "error";
      }
    });
});

function validateApiUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
