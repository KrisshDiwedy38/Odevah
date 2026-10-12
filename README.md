# Odevah

Odevah turns a user's existing Spotify library into time-boxed, task-specific audio streams for focused work sessions. Rather than algorithmically guessing new music like Spotify's own recommender, it builds on the user's existing taste and Spotify Premium subscription, aiming to remove the decision fatigue of picking music before a work session and help the listener settle into a flow state.

## Core Concept

- **Required inputs:** session duration and type of work. Everything else (genre, lyrics on/off, etc.) is optional.
- **Playlist arc:** steady-but-high BPM at the start, rising BPM as the session moves into flow state, then BPM/intensity taper toward the end to signal winding down.
- **Session extension:** partway through the wind-down phase, the app prompts the user to add 30 more minutes before the session fully tapers off.
- **Review flow:** the app generates a playlist/summary, the user can skip/regenerate the whole playlist (not edit individual tracks), then starts working.
- **Audience:** framed generically around "deep work" rather than any specific clinical condition.
- **North star:** success means the user makes zero changes to the generated playlist.
- **Long-term vision:** evolve from a playlist generator into a system that learns the user's work patterns over time.

## Setup

Odevah is self-hosted: it talks to Spotify through an app you register yourself, since Spotify caps a shared developer app's Development Mode at 5 authorized users. This is a five-minute one-time step per install.

1. Create a free app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) (requires a Spotify Premium account, since playback control needs it).
2. In the app's settings, add a **Redirect URI** of `http://127.0.0.1:5173/callback` (use `127.0.0.1`, not `localhost` — Spotify no longer accepts `localhost` in redirect URIs).
3. Copy the app's **Client ID** — you'll paste it into Odevah's onboarding screen on first run. No client secret is needed; Odevah authenticates with PKCE.
4. Run the app locally:

   ```bash
   npm install
   npm run dev
   ```

   Open `http://127.0.0.1:5173`, paste in your Client ID, and connect your Spotify account.

Tracks need tempo data from [ReccoBeats](https://reccobeats.com) (a free replacement for Spotify's own deprecated Audio Features endpoint) to be eligible for a session's playlist arc; not every saved track will have a match.

## Development

- `npm run dev` — start the dev server
- `npm run build` — typecheck and build
- `npm test` — run the test suite
- `npm run lint` — lint with oxlint

## License

[MIT](LICENSE)
