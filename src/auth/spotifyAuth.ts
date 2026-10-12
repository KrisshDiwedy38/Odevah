import { buildAuthorizeUrl, getRedirectUri } from "./pkce";
import { saveTokens, loadTokens, clearTokens, isExpired, type TokenSet } from "./tokenStore";

const CLIENT_ID_KEY = "odevah_client_id";

export function getClientId(): string | null {
  return localStorage.getItem(CLIENT_ID_KEY);
}

export function setClientId(clientId: string): void {
  localStorage.setItem(CLIENT_ID_KEY, clientId.trim());
}

export async function login(): Promise<void> {
  const clientId = getClientId();
  if (!clientId) throw new Error("No Spotify Client ID set");
  window.location.assign(await buildAuthorizeUrl(clientId));
}

export function logout(): void {
  clearTokens();
}

async function requestToken(body: URLSearchParams): Promise<TokenSet> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Spotify token request failed: ${res.status}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

// Called once on load when the URL contains ?code=... from the redirect.
export async function handleRedirectCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return false;

  const verifier = sessionStorage.getItem("odevah_pkce_verifier");
  const clientId = getClientId();
  if (!verifier || !clientId) return false;

  const tokens = await requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
      client_id: clientId,
      code_verifier: verifier,
    }),
  );
  saveTokens(tokens);
  sessionStorage.removeItem("odevah_pkce_verifier");
  window.history.replaceState({}, "", window.location.pathname === "/callback" ? "/" : window.location.pathname);
  return true;
}

async function refresh(tokens: TokenSet): Promise<TokenSet> {
  const clientId = getClientId();
  if (!clientId) throw new Error("No Spotify Client ID set");
  const refreshed = await requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
      client_id: clientId,
    }),
  );
  // Spotify may omit refresh_token on refresh responses; keep the old one if so.
  const merged = { ...refreshed, refreshToken: refreshed.refreshToken || tokens.refreshToken };
  saveTokens(merged);
  return merged;
}

// Returns a valid access token, refreshing first if needed, or null if the user isn't logged in.
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = loadTokens();
  if (!tokens) return null;
  if (!isExpired(tokens)) return tokens.accessToken;
  return (await refresh(tokens)).accessToken;
}
