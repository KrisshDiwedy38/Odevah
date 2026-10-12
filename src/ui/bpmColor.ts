// Shared steady(blue) -> peak(orange) gradient used for the BPM bar graph,
// the session ring, and the brand mark, so a given tempo always reads as the
// same color everywhere it appears.
const FLOW: [number, number, number] = [110, 140, 255];
const PEAK: [number, number, number] = [255, 107, 74];

export function bpmColor(value: number, min: number, max: number): string {
  const norm = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0.5;
  const r = Math.round(FLOW[0] + (PEAK[0] - FLOW[0]) * norm);
  const g = Math.round(FLOW[1] + (PEAK[1] - FLOW[1]) * norm);
  const b = Math.round(FLOW[2] + (PEAK[2] - FLOW[2]) * norm);
  return `rgb(${r}, ${g}, ${b})`;
}
