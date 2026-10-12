// ReccoBeats is a free drop-in replacement for Spotify's deprecated Audio
// Features endpoint: no API key required. It does NOT accept a raw Spotify
// track ID at the audio-features endpoint though - a Spotify ID has to be
// resolved to ReccoBeats' own catalog ID first via /track?ids=.
// https://reccobeats.com/docs/apis/get-track-by-id
// https://reccobeats.com/docs/apis/get-track-audio-features

export interface AudioFeatures {
  tempo: number;
  energy: number;
}

// ReccoBeats caps the `ids` batch lookup at 40 per request.
const MAX_BATCH_SIZE = 40;

// The audio-features endpoint (unlike the batch id lookup) is one request per
// track, so firing all of them at once for a large library risks the same 429
// that repeated regenerates used to cause. Capping concurrency instead of
// firing everything via Promise.all.
const FEATURE_FETCH_CONCURRENCY = 5;

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function spotifyIdFromHref(href: string): string | null {
  return href.match(/track\/([A-Za-z0-9]+)/)?.[1] ?? null;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function resolveCatalogIdsBatch(spotifyTrackIds: string[]): Promise<Map<string, string>> {
  const res = await fetch(`https://api.reccobeats.com/v1/track?ids=${spotifyTrackIds.join(",")}`);
  if (!res.ok) throw new Error(`ReccoBeats API error: ${res.status}`);
  const data = await res.json();
  const map = new Map<string, string>();
  for (const entry of data.content as { id: string; href: string }[]) {
    const spotifyId = spotifyIdFromHref(entry.href);
    if (spotifyId) map.set(spotifyId, entry.id);
  }
  return map;
}

// Maps spotifyTrackId -> ReccoBeats catalog id, for whichever tracks
// ReccoBeats actually has (not every track is in their catalog).
async function resolveCatalogIds(spotifyTrackIds: string[]): Promise<Map<string, string>> {
  if (spotifyTrackIds.length === 0) return new Map();
  const batches = await Promise.all(chunk(spotifyTrackIds, MAX_BATCH_SIZE).map(resolveCatalogIdsBatch));
  return new Map(batches.flatMap((batch) => [...batch]));
}

async function fetchFeatures(reccobeatsId: string): Promise<AudioFeatures | null> {
  const res = await fetch(`https://api.reccobeats.com/v1/track/${reccobeatsId}/audio-features`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`ReccoBeats API error: ${res.status}`);
  const data = await res.json();
  return { tempo: data.tempo, energy: data.energy };
}

// Not every library track is in ReccoBeats' catalog; missing tracks are
// simply left out of the map rather than failing the whole lookup.
export async function fetchAudioFeatures(spotifyTrackIds: string[]): Promise<Map<string, AudioFeatures>> {
  const catalogIds = await resolveCatalogIds(spotifyTrackIds);

  const entries = await mapWithConcurrency(
    [...catalogIds],
    FEATURE_FETCH_CONCURRENCY,
    async ([spotifyId, reccobeatsId]) => {
      const features = await fetchFeatures(reccobeatsId).catch(() => null);
      return features ? ([spotifyId, features] as const) : null;
    },
  );

  return new Map(entries.filter((entry): entry is [string, AudioFeatures] => entry !== null));
}
