export interface Track {
  id: string;
  name: string;
  artists: string;
  durationMs: number;
}

export interface Playlist {
  id: string;
  name: string;
  trackCount: number;
}

export class SpotifyApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function spotifyGet(path: string, accessToken: string) {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new SpotifyApiError(`Spotify API error on ${path}: ${res.status}`, res.status);
  return res.json();
}

async function spotifyWrite(method: "PUT" | "POST", path: string, accessToken: string, body?: unknown) {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 204) throw new SpotifyApiError(`Spotify API error on ${path}: ${res.status}`, res.status);
}

interface SavedTrackItem {
  track: { id: string; name: string; artists: { name: string }[]; duration_ms: number } | null;
}

const PAGE_SIZE = 50; // Spotify's max page size for /me/tracks.
// ponytail: caps the library at 10 pages (500 tracks) rather than paginating
// to the end of arbitrarily large libraries - plenty for a work-session pool,
// and keeps the one-time ReccoBeats lookup that follows from ballooning.
// Raise MAX_PAGES (or paginate to `total`) if that ceiling turns out to matter.
const MAX_PAGES = 10;

// Saved-track items can have a null `track` (e.g. local files, or tracks no
// longer available), and playlist items can be missing entirely or lack a
// `tracks` field (e.g. playlists that became unavailable) - both are known
// Spotify API quirks, so malformed entries are dropped rather than crashing
// the whole library load.
export async function fetchSavedTracks(accessToken: string): Promise<Track[]> {
  const tracks: Track[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await spotifyGet(`/me/tracks?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`, accessToken);
    const items = (data.items as SavedTrackItem[])
      .filter((item): item is SavedTrackItem & { track: NonNullable<SavedTrackItem["track"]> } => !!item?.track)
      .map((item) => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map((a) => a.name).join(", "),
        durationMs: item.track.duration_ms,
      }));
    tracks.push(...items);
    if (data.items.length < PAGE_SIZE) break;
  }

  return tracks;
}

export async function fetchPlaylists(accessToken: string, limit = 50): Promise<Playlist[]> {
  const data = await spotifyGet(`/me/playlists?limit=${limit}`, accessToken);
  return (data.items as ({ id: string; name: string; tracks?: { total: number } } | null)[])
    .filter((item): item is { id: string; name: string; tracks?: { total: number } } => !!item)
    .map((item) => ({
      id: item.id,
      name: item.name,
      trackCount: item.tracks?.total ?? 0,
    }));
}

// The device_id here comes from the Web Playback SDK player created in this
// tab (src/session/useSpotifyPlayer.ts), not from polling /me/player/devices.
export async function playTracks(accessToken: string, deviceId: string, trackIds: string[]): Promise<void> {
  await spotifyWrite("PUT", `/me/player/play?device_id=${deviceId}`, accessToken, {
    uris: trackIds.map((id) => `spotify:track:${id}`),
  });
}

export async function pausePlayback(accessToken: string, deviceId: string): Promise<void> {
  await spotifyWrite("PUT", `/me/player/pause?device_id=${deviceId}`, accessToken);
}

export async function queueTrack(accessToken: string, deviceId: string, trackId: string): Promise<void> {
  await spotifyWrite("POST", `/me/player/queue?uri=spotify:track:${trackId}&device_id=${deviceId}`, accessToken);
}
