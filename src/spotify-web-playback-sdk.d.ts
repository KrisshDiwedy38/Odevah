// Minimal ambient types for the parts of the Spotify Web Playback SDK this
// app actually uses. The SDK ships no types of its own and @types/spotify-web-playback-sdk
// isn't installed - hand-rolling avoids pulling in a dependency for a handful of members.
declare namespace Spotify {
  interface PlayerInit {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  interface Player {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: "ready" | "not_ready", cb: (data: { device_id: string }) => void): void;
    addListener(
      event: "initialization_error" | "authentication_error" | "account_error" | "playback_error",
      cb: (data: { message: string }) => void,
    ): void;
  }

  const Player: {
    new (init: PlayerInit): Player;
  };
}

interface Window {
  onSpotifyWebPlaybackSDKReady: () => void;
  Spotify: typeof Spotify;
}
