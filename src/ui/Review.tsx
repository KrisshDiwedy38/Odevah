import { useState } from "react";
import type { ArcTrack } from "../session/arc";
import { currentPhase, type Phase } from "../session/phase";
import { bpmColor } from "./bpmColor";

interface Props {
  arc: ArcTrack[];
  onAccept: () => void;
  onRegenerate: () => void;
  onBack: () => void;
}

const PHASE_LABEL: Record<Phase, string> = {
  steady: "Steady warm-up",
  rising: "Rising build",
  taper: "Taper down",
};

export function Review({ arc, onAccept, onRegenerate, onBack }: Props) {
  const totalMs = arc.reduce((sum, t) => sum + t.durationMs, 0);
  const totalMinutes = Math.round(totalMs / 60_000);
  const tempos = arc.map((t) => t.tempo);
  const minTempo = Math.min(...tempos);
  const maxTempo = Math.max(...tempos);

  const phaseGroups: Record<Phase, ArcTrack[]> = { steady: [], rising: [], taper: [] };
  let elapsedMs = 0;
  for (const track of arc) {
    phaseGroups[currentPhase(totalMs ? elapsedMs / totalMs : 0)].push(track);
    elapsedMs += track.durationMs;
  }

  const phases = (Object.keys(phaseGroups) as Phase[]).filter((phase) => phaseGroups[phase].length > 0);
  const [expandedPhase, setExpandedPhase] = useState<Phase | null>(phases[0] ?? null);

  return (
    <section className="screen">
      <div>
        <h2 className="title title--sm">Playlist ready</h2>
        <div className="status-line">
          {arc.length} tracks · ~{totalMinutes} min · from your Liked Songs
        </div>
      </div>

      <div className="field">
        <div className="graph">
          {arc.map((t) => {
            const norm = maxTempo > minTempo ? (t.tempo - minTempo) / (maxTempo - minTempo) : 0.5;
            return (
              <div
                key={t.id}
                className="graph-bar"
                style={{ height: `${Math.round(20 + norm * 56)}px`, background: bpmColor(t.tempo, minTempo, maxTempo) }}
              />
            );
          })}
        </div>
        <div className="graph-axis">
          <span>Start</span>
          <span>BPM curve</span>
          <span>End</span>
        </div>
      </div>

      <ul className="phase-list">
        {phases.map((phase) => {
          const tracks = phaseGroups[phase];
          const phaseTempos = tracks.map((t) => t.tempo);
          const lo = Math.round(Math.min(...phaseTempos));
          const hi = Math.round(Math.max(...phaseTempos));
          const expanded = expandedPhase === phase;
          return (
            <li key={phase}>
              <button
                type="button"
                className="phase-row"
                aria-expanded={expanded}
                onClick={() => setExpandedPhase(expanded ? null : phase)}
              >
                <span
                  className="phase-dot"
                  style={{ background: bpmColor((lo + hi) / 2, minTempo, maxTempo) }}
                />
                <div>
                  <div className="phase-name">{PHASE_LABEL[phase]}</div>
                  <div className="phase-meta">
                    {tracks.length} tracks · {lo === hi ? lo : `${lo}–${hi}`} BPM
                  </div>
                </div>
              </button>
              {expanded && (
                <ul className="track-list">
                  {tracks.map((t) => (
                    <li key={t.id} className="track-row">
                      <span className="track-name">{t.name}</span>
                      <span className="track-meta">
                        {t.artists} · {Math.round(t.tempo)} BPM
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <div className="spacer" />
      <button type="button" className="btn" onClick={onAccept}>
        Begin session
      </button>
      <div className="btn-row">
        <button type="button" className="btn btn--ghost" onClick={onRegenerate}>
          Regenerate
        </button>
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          Back
        </button>
      </div>
    </section>
  );
}
