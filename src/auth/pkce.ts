// Spotify Authorization Code + PKCE flow. No client secret involved, so this
// is safe to ship in an open-source, client-only app.

const SCOPES = [
  "user-library-read",
  "playlist-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  // Required by the Web Playback SDK itself (src/session/useSpotifyPlayer.ts),
  // separate from the /me/player/* scopes above - omitting user-read-email/
  // user-read-private makes the SDK throw "Invalid token scopes." even though
  // the play/pause calls still work.
  "streaming",
  "user-read-email",
  "user-read-private",
].join(" ");

function base64UrlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateCodeVerifier(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

export function getRedirectUri(): string {
  return `${window.location.origin}/callback`;
}

export async function buildAuthorizeUrl(clientId: string): Promise<string> {
  const verifier = generateCodeVerifier();
  sessionStorage.setItem("odevah_pkce_verifier", verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: await generateCodeChallenge(verifier),
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}
