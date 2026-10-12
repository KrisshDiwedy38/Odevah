export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
}

const KEY = "odevah_tokens";

export function saveTokens(tokens: TokenSet): void {
  sessionStorage.setItem(KEY, JSON.stringify(tokens));
}

export function loadTokens(): TokenSet | null {
  const raw = sessionStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as TokenSet) : null;
}

export function clearTokens(): void {
  sessionStorage.removeItem(KEY);
}

export function isExpired(tokens: TokenSet): boolean {
  return Date.now() >= tokens.expiresAt;
}
