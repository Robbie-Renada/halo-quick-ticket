import { generatePKCEParameters } from "../utils/pkce";

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  timestamp: number;
  code_verifier?: string; // Store code verifier for potential future use
}

interface HaloConfig {
  apiUrl: string;
  clientId: string;
  // Removed clientSecret since PKCE doesn't require it
}

class HaloAuth {
  private redirectUri: string;

  constructor() {
    this.redirectUri = chrome.identity.getRedirectURL();
    // console.log("Chrome extension redirect URI:", this.redirectUri);
  }

  // Generate cryptographically random state parameter
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
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
        "Please configure the extension settings and test your login before creating tasks.",
      );
    }
  }

  async authenticate(): Promise<string> {
    const { apiUrl, clientId } = await this.getConfig();

    if (!clientId) {
      throw new Error(
        "Client ID must be configured. Please check extension settings.",
      );
    }

    // Generate PKCE parameters and state
    const { codeVerifier, codeChallenge } = await generatePKCEParameters();
    const state = this.generateState();

    // Store state for validation
    await chrome.storage.local.set({ oauth_state: state });

    // Step 1: Get authorization code with PKCE and state
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: "read:tickets edit:tickets read:customers offline_access",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state: state,
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

      // Extract and validate state and authorization code from URL
      const url = new URL(redirectUrl);
      const returnedState = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      // Clean up stored state
      await chrome.storage.local.remove(["oauth_state"]);

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!returnedState || returnedState !== state) {
        throw new Error("Invalid state parameter - possible CSRF attack");
      }

      if (!code) {
        throw new Error("No authorization code received");
      }

      // Step 2: Exchange code for tokens using PKCE
      const tokenResponse = await fetch(`${apiUrl}/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          code: code,
          redirect_uri: this.redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token exchange error:", errorText);
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
    const { apiUrl, clientId } = await this.getConfig();

    try {
      const response = await fetch(`${apiUrl}/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: clientId,
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        // If refresh fails, clear stored tokens to force re-authentication
        await this.clearTokens();
        throw new Error("Token refresh failed - please log in again");
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
      // Clear tokens on any refresh error
      await this.clearTokens();
      throw new Error("Authentication expired - please log in again");
    }
  }

  private async getConfig(): Promise<HaloConfig> {
    const result = await chrome.storage.sync.get(["apiUrl", "clientId"]);
    if (!result.apiUrl) {
      throw new Error("API URL not configured");
    }

    // Validate that API URL is HTTPS
    const url = new URL(result.apiUrl);
    if (url.protocol !== "https:") {
      throw new Error("API URL must use HTTPS for security");
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

  private async clearTokens(): Promise<void> {
    await chrome.storage.local.remove(["auth_token", "oauth_state"]);
  }

  private isTokenExpired(token: TokenData): boolean {
    const expiryTime = token.timestamp + token.expires_in * 1000;
    return Date.now() >= expiryTime;
  }

  async signOut(): Promise<void> {
    // Clear all authentication data
    await this.clearTokens();

    try {
      const { apiUrl } = await this.getConfig();
      const logoutUrl = `${apiUrl}/auth/logout`;

      await chrome.identity.launchWebAuthFlow({
        url: logoutUrl,
        interactive: false,
      });
    } catch (error) {
      // console.log("Logout flow completed");
    }
  }
}

export default new HaloAuth();
