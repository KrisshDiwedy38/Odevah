import { useEffect, useRef, useState } from "react";
import { pausePlayback, playTracks, queueTrack, SpotifyApiError } from "../api/spotify";
import { login, logout } from "../auth/spotifyAuth";
import { extendTaper, type ArcTrack } from "../session/arc";
import { formatDuration } from "../session/countdown";
import { useCountdown } from "../session/useCountdown";
import { useSpotifyPlayer } from "../session/useSpotifyPlayer";
import { currentPhase, EXTENSION_PROMPT_AT } from "../session/phase";
import { bpmColor } from "./bpmColor";

const EXTENSION_MINUTES = 30;
const CANCEL_ARM_MS = 3000;

// The SDK's "ready" event can fire slightly before Spotify's Connect backend
// has finished registering the device for /me/player/*, so the very first
// play right after ready can 404 even though the device is genuinely fine a
// moment later. Retry a few times before surfacing an error.
async function playWithRetry(accessToken: string, deviceId: string, trackIds: string[], attempts = 5): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      await playTracks(accessToken, deviceId, trackIds);
      return;
    } catch (err) {
      const isStaleDevice = err instanceof SpotifyApiError && err.status === 404;
      if (!isStaleDevice || i === attempts - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

const PHASE_LABEL = {
  steady: "Settling in",
  rising: "In flow",
  taper: "Winding down",
};

interface Props {
  accessToken: string;
  arc: ArcTrack[];
  extensionPool: ArcTrack[];
  durationMinutes: number;
  workType: string;
  endAt: number;
  onEndAtChange: (endAt: number) => void;
  onCancel: () => void;
}

export function ActiveSession({
  accessToken,
  arc,
  extensionPool,
  durationMinutes,
  workType,
  endAt,
  onEndAtChange,
  onCancel,
}: Props) {
  const remaining = useCountdown(endAt);
  const isDone = remaining <= 0;
  const startAtRef = useRef(Date.now());
  const armTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { deviceId, error: playerError } = useSpotifyPlayer(accessToken);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [extensionDecided, setExtensionDecided] = useState(false);
  const [pool, setPool] = useState(extensionPool);
  const [cancelArmed, setCancelArmed] = useState(false);

  useEffect(() => {
    if (!deviceId || started) return;
    setStarted(true);
    playWithRetry(accessToken, deviceId, arc.map((t) => t.id)).catch((err) => setPlaybackError((err as Error).message));
    // Only ever start playback once per session, as soon as the in-tab player is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, started]);

  useEffect(() => () => clearTimeout(armTimerRef.current), []);

  const elapsedSeconds = Math.min((Date.now() - startAtRef.current) / 1000, durationMinutes * 60);
  const fraction = elapsedSeconds / (durationMinutes * 60);
  const phase = currentPhase(Math.min(fraction, 1));

  const canOfferExtension = fraction >= EXTENSION_PROMPT_AT && !extensionDecided && !isDone && pool.length > 0;

  const tempos = arc.map((t) => t.tempo);
  const minTempo = Math.min(...tempos);
  const maxTempo = Math.max(...tempos);
  const arcTotalMs = arc.reduce((sum, t) => sum + t.durationMs, 0) || 1;
  let acc = 0;
  const stops = arc.map((t) => {
    const pct = (acc / arcTotalMs) * 100;
    acc += t.durationMs;
    return { pct, color: bpmColor(t.tempo, minTempo, maxTempo), tempo: t.tempo };
  });
  const elapsedPct = Math.min(100, fraction * 100);
  const currentStop = stops.reduce((best, s) => (s.pct <= elapsedPct ? s : best), stops[0]);
  const ringBase = `conic-gradient(from -90deg, ${stops.map((s) => `${s.color} ${s.pct.toFixed(2)}%`).join(", ")})`;
  const ringCover = `conic-gradient(from -90deg, transparent 0%, transparent ${elapsedPct}%, rgba(20,21,26,0.88) ${elapsedPct}%, rgba(20,21,26,0.88) 100%)`;

  async function acceptExtension() {
    setExtensionDecided(true);
    const extra = extendTaper(pool, EXTENSION_MINUTES);
    setPool((p) => p.filter((t) => !extra.some((e) => e.id === t.id)));
    onEndAtChange(endAt + EXTENSION_MINUTES * 60_000);
    if (deviceId) {
      for (const track of extra) {
        await queueTrack(accessToken, deviceId, track.id).catch(() => undefined);
      }
    }
  }

  // Spotify's OAuth grant is scope-locked at authorization time - refreshing
  // the access token doesn't add newly-requested scopes, so a scope/auth
  // error needs a real re-consent, not just a reload. The session itself
  // survives this round trip (src/session/sessionStore.ts), so the user lands
  // right back here once reconnected.
  function reconnect() {
    logout();
    login();
  }

  function cancel() {
    if (deviceId) pausePlayback(accessToken, deviceId).catch(() => undefined);
    onCancel();
  }

  function onCancelClick() {
    if (isDone) {
      cancel();
      return;
    }
    if (cancelArmed) {
      clearTimeout(armTimerRef.current);
      cancel();
      return;
    }
    setCancelArmed(true);
    armTimerRef.current = setTimeout(() => setCancelArmed(false), CANCEL_ARM_MS);
  }

  return (
    <section className="screen screen--centered">
      {workType && <div className="work-label">{workType}</div>}

      <div className="ring">
        <div className="ring-mask">
          <div className="ring-layer" style={{ background: ringBase }} />
          <div className="ring-layer" style={{ background: ringCover }} />
        </div>
        <div className="ring-center">
          <div className="time-label">{formatDuration(remaining)}</div>
          <div className="zone-label" style={{ color: currentStop?.color }}>
            {PHASE_LABEL[phase]} · ~{Math.round(currentStop?.tempo ?? 0)} BPM
          </div>
        </div>
      </div>

      {playerError && (
        <p className="error-text">
          {playerError}{" "}
          <button type="button" className="btn btn--ghost" onClick={reconnect}>
            Reconnect Spotify
          </button>
        </p>
      )}
      {playbackError && (
        <p className="error-text">
          {playbackError}{" "}
          <button type="button" className="btn btn--ghost" onClick={() => window.location.reload()}>
            Retry
          </button>
        </p>
      )}
      {isDone && <p className="body-text">Session complete.</p>}

      {canOfferExtension && (
        <div className="extension-prompt">
          <p className="body-text">Add {EXTENSION_MINUTES} more minutes before winding down?</p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={acceptExtension}>
              Extend
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setExtensionDecided(true)}>
              No thanks
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`btn btn--ghost${cancelArmed ? " btn--danger" : ""}`}
        onClick={onCancelClick}
      >
        {isDone ? "Done" : cancelArmed ? "Tap again to cancel" : "Cancel"}
      </button>
    </section>
  );
}
