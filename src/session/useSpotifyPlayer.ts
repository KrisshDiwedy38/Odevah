import { useEffect, useRef, useState } from "react";

let sdkLoadPromise: Promise<typeof Spotify> | null = null;

function loadSpotifySDK(): Promise<typeof Spotify> {
  if (!sdkLoadPromise) {
    sdkLoadPromise = new Promise((resolve) => {
      window.onSpotifyWebPlaybackSDKReady = () => resolve(window.Spotify);
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      document.head.appendChild(script);
    });
  }
  return sdkLoadPromise;
}

// Plays audio inside this tab via the Web Playback SDK, rather than remote-
// controlling an already-open Spotify app via Connect. Trade-off: playback
// now stops if this tab is closed or backgrounded (see CLAUDE.md).
export function useSpotifyPlayer(accessToken: string) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  useEffect(() => {
    let player: Spotify.Player | undefined;
    let cancelled = false;

    loadSpotifySDK().then((SpotifySdk) => {
      if (cancelled) return;
      player = new SpotifySdk.Player({
        name: "Odevah",
        getOAuthToken: (cb) => cb(tokenRef.current),
        volume: 1,
      });
      player.addListener("ready", ({ device_id }) => setDeviceId(device_id));
      player.addListener("not_ready", () => setDeviceId(null));
      player.addListener("initialization_error", ({ message }) => setError(message));
      player.addListener("authentication_error", ({ message }) => setError(message));
      player.addListener("account_error", () => setError("Spotify Premium is required for in-app playback."));
      player.connect();
    });

    return () => {
      cancelled = true;
      player?.disconnect();
    };
    // Reconnect only if the tab remounts the session; token refreshes flow through tokenRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { deviceId, error };
}
