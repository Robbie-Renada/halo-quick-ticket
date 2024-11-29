interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  timestamp: number;
}

interface HaloConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
}

class HaloPSAAuth {
  private redirectUri: string;

  constructor() {
    this.redirectUri = chrome.identity.getRedirectURL();
    console.log("Chrome extension redirect URI:", this.redirectUri);
  }

  async getAuthToken(): Promise<string> {
    try {
      const token = await this.getStoredToken();
      if (token) {
        if (!this.isTokenExpired(token)) {
          return token.access_token;
        }
        if (token.refresh_token) {
          return this.refreshToken(token.refresh_token);
        }
      }
      return this.authenticate();
    } catch (error) {
      throw new Error(
        "Please configure the extension settings and test your login before creating tasks."
      );
    }
  }

  async authenticate(): Promise<string> {
    const { apiUrl, clientId, clientSecret } = await this.getConfig();

    if (!clientId || !clientSecret) {
      throw new Error("Client ID and Client Secret must be configured. Please check extension settings.");
    }

    // Step 1: Get authorization code
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'read:tickets edit:tickets offline_access'
    });

    const authUrl = `${apiUrl}/auth/authorize?${params.toString()}`;

    try {
      const redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true,
      });

      if (!redirectUrl) {
        throw new Error("Redirect URL is undefined");
      }

      // Extract authorization code from URL
      const url = new URL(redirectUrl);
      const code = url.searchParams.get('code');
      
      if (!code) {
        throw new Error("No authorization code received");
      }

      // Step 2: Exchange code for tokens
      const tokenResponse = await fetch(`${apiUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: this.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const tokenData = await tokenResponse.json();
      
      const token: TokenData = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in || 3600,
        timestamp: Date.now(),
      };

      await this.storeToken(token);
      return token.access_token;
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Authentication failed");
    }
  }

  private async refreshToken(refreshToken: string): Promise<string> {
    const { apiUrl, clientId, clientSecret } = await this.getConfig();

    try {
      const response = await fetch(`${apiUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const tokenData = await response.json();
      
      const token: TokenData = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken,
        expires_in: tokenData.expires_in || 3600,
        timestamp: Date.now(),
      };

      await this.storeToken(token);
      return token.access_token;
    } catch (error) {
      console.error("Token refresh error:", error);
      throw new Error("Failed to refresh token");
    }
  }

  private async getConfig(): Promise<HaloConfig> {
    const result = await chrome.storage.sync.get(["apiUrl", "clientId", "clientSecret"]);
    if (!result.apiUrl) {
      throw new Error("API URL not configured");
    }
    return {
      apiUrl: result.apiUrl.replace(/\/+$/, ""),
      clientId: result.clientId,
      clientSecret: result.clientSecret,
    };
  }

  private async getStoredToken(): Promise<TokenData | null> {
    const result = await chrome.storage.local.get(["auth_token"]);
    return result.auth_token || null;
  }

  private async storeToken(token: TokenData): Promise<void> {
    await chrome.storage.local.set({ auth_token: token });
  }

  private isTokenExpired(token: TokenData): boolean {
    const expiryTime = token.timestamp + token.expires_in * 1000;
    return Date.now() >= expiryTime;
  }

  async signOut(): Promise<void> {
    await chrome.storage.local.remove(["auth_token"]);

    const { apiUrl } = await this.getConfig();
    const logoutUrl = `${apiUrl}/auth/logout`;

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