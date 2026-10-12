import { describe, expect, it } from "vitest";
import { buildArc, extendTaper, type ArcTrack } from "./arc";

function track(tempo: number): ArcTrack {
  return { id: `t${tempo}`, name: `Track ${tempo}`, artists: "Artist", durationMs: 60_000, tempo };
}

describe("buildArc", () => {
  it("returns nothing for an empty pool", () => {
    expect(buildArc([], 25)).toEqual([]);
  });

  it("starts steady-but-high, peaks mid-arc, and tapers to the end", () => {
    const pool = [60, 70, 80, 90, 100, 110, 120, 130, 140, 150].map(track);

    const arc = buildArc(pool, 10); // 10 one-minute tracks exactly fill 10 minutes

    expect(arc).toHaveLength(10);
    expect(new Set(arc.map((t) => t.id)).size).toBe(10); // no repeats

    const maxTempoIndex = arc.reduce((best, t, i) => (t.tempo > arc[best].tempo ? i : best), 0);
    expect(maxTempoIndex).toBeGreaterThan(0);
    expect(maxTempoIndex).toBeLessThan(arc.length - 1);

    expect(arc[0].tempo).toBeGreaterThanOrEqual(100); // steady-high start
    expect(arc[arc.length - 1].tempo).toBeLessThan(arc[0].tempo); // tapered ending
  });

  it("stops once the requested duration is covered", () => {
    const pool = Array.from({ length: 20 }, (_, i) => track(80 + i));
    const arc = buildArc(pool, 5); // 5 minutes of 1-minute tracks
    expect(arc.length).toBeLessThanOrEqual(6);
    const totalMs = arc.reduce((sum, t) => sum + t.durationMs, 0);
    expect(totalMs).toBeGreaterThanOrEqual(5 * 60_000);
  });
});

describe("extendTaper", () => {
  it("picks the lowest-tempo tracks to cover the requested extra minutes", () => {
    const pool = [150, 60, 140, 70, 130, 80].map(track);
    const extra = extendTaper(pool, 2); // 2 minutes of 1-minute tracks

    expect(extra.map((t) => t.tempo)).toEqual([60, 70]);
  });

  it("returns fewer tracks than requested when the pool runs out", () => {
    const pool = [90, 100].map(track);
    const extra = extendTaper(pool, 10);
    expect(extra).toHaveLength(2);
  });
});
