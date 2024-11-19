interface TokenData {
  access_token: string;
  expires_in: number;
  timestamp: number;
}

interface HaloConfig {
  apiUrl: string;
  clientId: string;
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
      if (token && !this.isTokenExpired(token)) {
        return token.access_token;
      }
      return this.authenticate();
    } catch (error) {
      throw new Error(
        "Please configure the extension settings and test your login before creating tasks."
      );
    }
  }

  async authenticate(): Promise<string> {
    const { apiUrl, clientId } = await this.getConfig();

    if (!clientId) {
      throw new Error("Client ID not configured. Please check extension settings.");
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.redirectUri,
      response_type: 'token',
      scope: 'read:tickets edit:tickets'
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

      const hash = new URL(redirectUrl).hash.substring(1);
      const params = new URLSearchParams(hash);
      const token: TokenData = {
        access_token: params.get("access_token") || '',
        expires_in: parseInt(params.get("expires_in") || '3600'),
        timestamp: Date.now(),
      };

      await this.storeToken(token);
      return token.access_token;
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Authentication failed");
    }
  }

  private async getConfig(): Promise<HaloConfig> {
    const result = await chrome.storage.sync.get(["apiUrl", "clientId"]);
    if (!result.apiUrl) {
      throw new Error("API URL not configured");
    }
    return {
      apiUrl: result.apiUrl.replace(/\/+$/, ""),
      clientId: result.clientId,
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