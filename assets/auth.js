class HaloPSAAuth {
  constructor() {
    this.redirectUri = chrome.identity.getRedirectURL();
    console.log("Chrome extension redirect URI:", this.redirectUri);
  }

  async getAuthToken() {
    try {
      const token = await this.getStoredToken();
      if (token && !this.isTokenExpired(token)) {
        return token.access_token;
      }
      return this.authenticate();
    } catch (error) {
      throw new Error(
        "Please configure the extension settings and test your login before creating tasks.",
      );
    }
  }

  async authenticate() {
    const { apiUrl, clientId } = await this.getConfig();

    if (!clientId) {
      throw new Error(
        "Client ID not configured. Please check extension settings.",
      );
    }

    const authUrl =
      `${apiUrl}/auth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent("read:tickets edit:tickets")}`;

    try {
      const redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true,
      });

      const hash = new URL(redirectUrl).hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = {
        access_token: params.get("access_token"),
        expires_in: parseInt(params.get("expires_in")),
        timestamp: Date.now(),
      };

      await this.storeToken(token);
      return token.access_token;
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Authentication failed");
    }
  }

  async getConfig() {
    const result = await chrome.storage.sync.get(["apiUrl", "clientId"]);
    if (!result.apiUrl) {
      throw new Error("API URL not configured");
    }
    return {
      apiUrl: result.apiUrl.replace(/\/+$/, ""),
      clientId: result.clientId,
    };
  }

  async getStoredToken() {
    const result = await chrome.storage.local.get(["auth_token"]);
    return result.auth_token;
  }

  async storeToken(token) {
    await chrome.storage.local.set({ auth_token: token });
  }

  isTokenExpired(token) {
    const expiryTime = token.timestamp + token.expires_in * 1000;
    return Date.now() >= expiryTime;
  }

  async signOut() {
    // Clear the stored token
    await chrome.storage.local.remove(["auth_token"]);

    // Optionally, if HaloPSA provides a logout endpoint:
    const { apiUrl } = await this.getConfig();
    const logoutUrl = `${apiUrl}/oauth/logout`;

    try {
      await chrome.identity.launchWebAuthFlow({
        url: logoutUrl,
        interactive: false,
      });
    } catch (error) {
      console.log("Logout flow completed");
    }
  }
}

export default new HaloPSAAuth();
