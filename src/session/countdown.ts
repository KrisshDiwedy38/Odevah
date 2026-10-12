export function endTimestamp(durationMinutes: number, now = Date.now()): number {
  return now + durationMinutes * 60_000;
}

export function remainingSeconds(endAt: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
