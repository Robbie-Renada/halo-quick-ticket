/**
 * PKCE (Proof Key for Code Exchange) utility functions
 * For secure OAuth 2.0 authentication in browser extensions
 */

/**
 * Generates a cryptographically random code verifier
 * @param length The length of the code verifier (43-128 characters)
 * @returns A base64url encoded string
 */
export function generateCodeVerifier(length: number = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64urlEncode(array);
}

/**
 * Creates a code challenge from a code verifier using SHA256
 * @param verifier The code verifier
 * @returns A base64url encoded SHA256 hash of the verifier
 */
export async function createCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64urlEncode(new Uint8Array(digest));
}

/**
 * Base64url encode a Uint8Array
 * @param array The array to encode
 * @returns Base64url encoded string
 */
function base64urlEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Generate PKCE parameters for OAuth authorization
 * @returns Object containing code verifier and code challenge
 */
export async function generatePKCEParameters(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await createCodeChallenge(codeVerifier);

  return {
    codeVerifier,
    codeChallenge,
  };
}
