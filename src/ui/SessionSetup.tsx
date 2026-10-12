import { useState } from "react";
import { DURATION_PRESETS_MIN } from "../session/presets";

interface Props {
  statusLine: string;
  onStart: (durationMinutes: number, workType: string) => void;
}

export function SessionSetup({ statusLine, onStart }: Props) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(DURATION_PRESETS_MIN[0]);
  const [customMinutes, setCustomMinutes] = useState("");
  const [workType, setWorkType] = useState("");

  const duration = customMinutes ? Number(customMinutes) : selectedPreset;
  const canStart = !!duration && duration > 0;

  return (
    <section className="screen">
      <div className="status-line">{statusLine}</div>

      <h2 className="title title--md">New session</h2>

      <div className="field">
        <span className="field-label">Duration</span>
        <div className="segmented" role="group" aria-label="Duration presets">
          {DURATION_PRESETS_MIN.map((min) => (
            <button
              key={min}
              type="button"
              aria-pressed={selectedPreset === min && !customMinutes}
              onClick={() => {
                setSelectedPreset(min);
                setCustomMinutes("");
              }}
            >
              {min} min
            </button>
          ))}
        </div>
        <input
          type="text"
          inputMode="numeric"
          aria-label="Custom minutes"
          placeholder="Custom minutes"
          value={customMinutes}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, "");
            setCustomMinutes(digits);
            if (digits) setSelectedPreset(null);
          }}
        />
      </div>

      <div className="field field--sans">
        <label className="field-label" htmlFor="work-type">
          Type of work (optional)
        </label>
        <input
          id="work-type"
          type="text"
          placeholder="e.g. Deep Work, Coding, Studying"
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
        />
      </div>

      <div className="spacer" />
      <button type="button" className="btn" disabled={!canStart} onClick={() => onStart(duration as number, workType)}>
        Start session
      </button>
    </section>
  );
}
