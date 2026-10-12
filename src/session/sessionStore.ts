import type { ArcTrack } from "./arc";

export interface SavedSession {
  durationMinutes: number;
  workType: string;
  endAt: number;
  arc: ArcTrack[];
  extensionPool: ArcTrack[];
}

const KEY = "odevah_session";

// localStorage, not sessionStorage: this needs to survive the tab/browser
// being closed accidentally, not just a reload.
export function saveSession(session: SavedSession): void {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function loadSession(): SavedSession | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  const session = JSON.parse(raw) as SavedSession;
  if (session.endAt <= Date.now()) {
    localStorage.removeItem(KEY);
    return null;
  }
  return session;
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}
