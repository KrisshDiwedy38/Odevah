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

## Tech Stack

Not yet established — no code has been committed to this repository.

## Setup / Installation

Not applicable yet — there is no build to set up.

## Project Structure

None yet. This repository currently contains only this README.

## Status

**Pre-code.** This repository has no implementation yet — no source files, dependencies, or configuration. This README documents the product concept so implementation work has a shared reference point from the start.

## Roadmap

- [ ] Decide on tech stack (client, backend, Spotify API integration approach)
- [ ] Spotify OAuth + library ingestion
- [ ] Session-duration/work-type input flow
- [ ] BPM-arc playlist generation logic
- [ ] Wind-down "add 30 more minutes" prompt
- [ ] Playlist review/regenerate screen
