import { useEffect, useState } from "react";
import { fetchAudioFeatures } from "./api/reccobeats";
import { fetchPlaylists, fetchSavedTracks, type Track } from "./api/spotify";
import { getClientId, getValidAccessToken, handleRedirectCallback, login } from "./auth/spotifyAuth";
import { buildArc, type ArcTrack } from "./session/arc";
import { endTimestamp } from "./session/countdown";
import { clearSession, loadSession, saveSession } from "./session/sessionStore";
import { ActiveSession } from "./ui/ActiveSession";
import { Connect } from "./ui/Connect";
import { Onboarding } from "./ui/Onboarding";
import { Review } from "./ui/Review";
import { SessionSetup } from "./ui/SessionSetup";
import { Shell } from "./ui/Shell";

type SessionRequest = { durationMinutes: number; workType: string };
type Session = SessionRequest & { endAt: number; arc: ArcTrack[]; extensionPool: ArcTrack[] };

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function App() {
  const [clientId, setClientIdState] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const [libraryTracks, setLibraryTracks] = useState<Track[]>([]);
  const [libraryStatus, setLibraryStatus] = useState("Loading your library…");

  const [request, setRequest] = useState<SessionRequest | null>(null);
  const [pool, setPool] = useState<ArcTrack[] | null>(null);
  const [arc, setArc] = useState<ArcTrack[] | null>(null);
  const [extensionPool, setExtensionPool] = useState<ArcTrack[]>([]);
  const [arcError, setArcError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);

  const [session, setSession] = useState<Session | null>(() => loadSession());

  useEffect(() => {
    if (session) saveSession(session);
    else clearSession();
  }, [session]);

  useEffect(() => {
    handleRedirectCallback()
      .catch(() => undefined)
      .finally(async () => {
        setClientIdState(getClientId());
        setAccessToken(await getValidAccessToken());
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([fetchSavedTracks(accessToken), fetchPlaylists(accessToken)])
      .then(([tracks, playlists]) => {
        setLibraryTracks(tracks);
        setLibraryStatus(`${tracks.length} saved tracks, ${playlists.length} playlists synced`);
      })
      .catch((err) => setLibraryStatus(`Couldn't load your library: ${(err as Error).message}`));
  }, [accessToken]);

  // Tempo lookup only ever needs to happen once per library load - regenerating
  // the arc from the same pool doesn't require asking ReccoBeats again, and
  // doing so anyway burned through its rate limit after a few regenerates.
  async function ensurePool(): Promise<ArcTrack[]> {
    if (pool) return pool;
    const features = await fetchAudioFeatures(libraryTracks.map((t) => t.id));
    const enriched = libraryTracks
      .filter((t) => features.has(t.id))
      .map((t) => ({ ...t, tempo: features.get(t.id)!.tempo }));
    setPool(enriched);
    return enriched;
  }

  async function generate(req: SessionRequest) {
    setRequest(req);
    setBuilding(true);
    setArcError(null);
    try {
      const enrichedPool = await ensurePool();

      if (enrichedPool.length === 0) {
        setArcError("None of your saved tracks have tempo data available yet — try saving a few more songs.");
        setArc(null);
      } else {
        const newArc = buildArc(shuffle(enrichedPool), req.durationMinutes);
        const usedIds = new Set(newArc.map((t) => t.id));
        setArc(newArc);
        setExtensionPool(enrichedPool.filter((t) => !usedIds.has(t.id)));
      }
    } catch (err) {
      setArcError((err as Error).message);
    } finally {
      setBuilding(false);
    }
  }

  function backToSetup() {
    setRequest(null);
    setArc(null);
    setArcError(null);
  }

  if (!ready) return null;

  if (!clientId) {
    return (
      <Shell>
        <Onboarding onSaved={() => setClientIdState(getClientId())} />
      </Shell>
    );
  }

  if (!accessToken) {
    return (
      <Shell>
        <Connect onConnect={() => login()} />
      </Shell>
    );
  }

  if (session) {
    return (
      <Shell>
        <ActiveSession
          accessToken={accessToken}
          arc={session.arc}
          extensionPool={session.extensionPool}
          durationMinutes={session.durationMinutes}
          workType={session.workType}
          endAt={session.endAt}
          onEndAtChange={(newEndAt) => setSession((prev) => prev && { ...prev, endAt: newEndAt })}
          onCancel={() => setSession(null)}
        />
      </Shell>
    );
  }

  if (building) {
    return (
      <Shell>
        <section className="screen screen--centered">
          <p className="body-text">Building your session…</p>
        </section>
      </Shell>
    );
  }

  if (arcError) {
    return (
      <Shell>
        <section className="screen screen--centered">
          <p className="body-text">{arcError}</p>
          <button type="button" className="btn" onClick={backToSetup}>
            Back
          </button>
        </section>
      </Shell>
    );
  }

  if (arc && request) {
    return (
      <Shell>
        <Review
          arc={arc}
          onAccept={() => {
            setSession({ ...request, endAt: endTimestamp(request.durationMinutes), arc, extensionPool });
            setArc(null);
            setRequest(null);
          }}
          onRegenerate={() => generate(request)}
          onBack={backToSetup}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <SessionSetup statusLine={libraryStatus} onStart={(durationMinutes, workType) => generate({ durationMinutes, workType })} />
    </Shell>
  );
}

export default App;
