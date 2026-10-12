import { RISING_END, STEADY_END } from "./phase";

export interface ArcTrack {
  id: string;
  name: string;
  artists: string;
  durationMs: number;
  tempo: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0];
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// Steady-but-high for the first 20%, rising into a peak through 80%, then
// tapering back down to signal winding down, per the README's playlist arc.
function targetTempo(f: number, low: number, high: number, peak: number): number {
  if (f < STEADY_END) return high;
  if (f < RISING_END) return high + (peak - high) * ((f - STEADY_END) / (RISING_END - STEADY_END));
  return peak + (low - peak) * ((f - RISING_END) / (1 - RISING_END));
}

// Tracks within this many BPM of the true closest match are treated as
// equally good, so the pick depends on `pool`'s order rather than always
// being the single global-nearest track. buildArc stays a pure function of
// its input (same pool -> same arc), but this lets the caller shuffling
// `pool` before each call (src/App.tsx) actually produce a different arc on
// regenerate instead of silently rebuilding the identical one every time.
const TOLERANCE_BPM = 6;

// Greedily orders tracks from `pool` to match the target tempo curve,
// filling until the requested duration is covered or tracks run out.
export function buildArc(pool: ArcTrack[], durationMinutes: number): ArcTrack[] {
  if (pool.length === 0) return [];

  const tempos = pool.map((t) => t.tempo).sort((a, b) => a - b);
  const low = percentile(tempos, 0.25);
  const high = percentile(tempos, 0.75);
  const peak = percentile(tempos, 0.9);
  const totalMs = durationMinutes * 60_000;

  const remaining = [...pool];
  const arc: ArcTrack[] = [];
  let elapsedMs = 0;

  while (elapsedMs < totalMs && remaining.length > 0) {
    const target = targetTempo(Math.min(elapsedMs / totalMs, 1), low, high, peak);
    const diffs = remaining.map((t) => Math.abs(t.tempo - target));
    const bestDiff = Math.min(...diffs);
    const chosenIndex = diffs.findIndex((diff) => diff <= bestDiff + TOLERANCE_BPM);
    const [chosen] = remaining.splice(chosenIndex, 1);
    arc.push(chosen);
    elapsedMs += chosen.durationMs;
  }

  return arc;
}

// For the wind-down extension prompt: continues the taper with the lowest-
// tempo tracks left in the pool rather than restarting the whole arc.
export function extendTaper(pool: ArcTrack[], minutes: number): ArcTrack[] {
  const sorted = [...pool].sort((a, b) => a.tempo - b.tempo);
  const totalMs = minutes * 60_000;
  const picked: ArcTrack[] = [];
  let elapsedMs = 0;

  for (const track of sorted) {
    if (elapsedMs >= totalMs) break;
    picked.push(track);
    elapsedMs += track.durationMs;
  }

  return picked;
}
