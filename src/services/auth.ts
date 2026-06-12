import { generatePKCEParameters } from "../utils/pkce";

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  timestamp: number;
}

interface HaloConfig {
  apiUrl: string;
  clientId: string;
  // Removed clientSecret since PKCE doesn't require it
}

// Thrown when the Halo auth server definitively rejects a refresh token
// (as opposed to a network failure, where the stored token is still usable).
class RefreshRejectedError extends Error {}

class HaloAuth {
  private redirectUri: string;
  private renewPromise: Promise<string> | null = null;

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
    const token = await this.getStoredToken();
    if (token && !this.isTokenExpired(token)) {
      return token.access_token;
    }

    // Share a single in-flight renewal across concurrent callers. Halo
    // rotates refresh tokens, so parallel refresh attempts would consume
    // the token once and reject the rest, forcing a spurious sign-out.
    if (!this.renewPromise) {
      this.renewPromise = this.renewToken(token).finally(() => {
        this.renewPromise = null;
      });
    }
    return this.renewPromise;
  }

  private async renewToken(stored: TokenData | null): Promise<string> {
    if (stored?.refresh_token) {
      try {
        return await this.refreshToken(stored.refresh_token);
      } catch (error) {
        if (!(error instanceof RefreshRejectedError)) {
          throw error;
        }
        // Refresh token rejected - fall through to a fresh sign-in
      }
    }
    return this.authenticate();
  }

  async authenticate(): Promise<string> {
    // Try a silent flow first - if the browser still has a valid Halo
    // session this renews the token without interrupting the user.
    try {
      return await this.runAuthFlow(false);
    } catch {
      return this.runAuthFlow(true);
    }
  }

  private async runAuthFlow(interactive: boolean): Promise<string> {
    const { apiUrl, clientId } = await this.getConfig();

    if (!clientId) {
      throw new Error(
        "Client ID must be configured. Please check extension settings.",
      );
    }

    // Generate PKCE parameters and state
    const { codeVerifier, codeChallenge } = await generatePKCEParameters();
    const state = this.generateState();

    // Step 1: Get authorization code with PKCE and state
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: "read:tickets edit:tickets read:customers",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state: state,
    });

    const authUrl = `${apiUrl}/auth/authorize?${params.toString()}`;

    const redirectUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive,
    });

    if (!redirectUrl) {
      throw new Error("Redirect URL is undefined");
    }

    // Extract and validate state and authorization code from URL
    const url = new URL(redirectUrl);
    const returnedState = url.searchParams.get("state");
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

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
  }

  private async refreshToken(refreshToken: string): Promise<string> {
    const { apiUrl, clientId } = await this.getConfig();

    let response: Response;
    try {
      response = await fetch(`${apiUrl}/auth/token`, {
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
    } catch (error) {
      // Network failure - keep the stored tokens so renewal can be retried
      console.error("Token refresh error:", error);
      throw new Error("Could not reach Halo - check your connection");
    }

    if (!response.ok) {
      // The auth server rejected the refresh token - clear stored tokens
      // so the caller falls back to a fresh sign-in
      await this.clearTokens();
      throw new RefreshRejectedError("Token refresh failed");
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
    // oauth_state is a legacy key from older versions
    await chrome.storage.local.remove(["auth_token", "oauth_state"]);
  }

  private isTokenExpired(token: TokenData): boolean {
    // Treat the token as expired 60s early so requests don't fail mid-flight
    const expiryTime = token.timestamp + (token.expires_in - 60) * 1000;
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
