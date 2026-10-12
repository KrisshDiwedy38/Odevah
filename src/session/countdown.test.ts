import { describe, expect, it } from "vitest";
import { endTimestamp, formatDuration, remainingSeconds } from "./countdown";

describe("countdown", () => {
  it("computes an end timestamp N minutes out", () => {
    expect(endTimestamp(25, 0)).toBe(25 * 60_000);
  });

  it("computes remaining seconds and clamps at zero", () => {
    expect(remainingSeconds(10_000, 0)).toBe(10);
    expect(remainingSeconds(1_000, 5_000)).toBe(0);
  });

  it("formats seconds as m:ss", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(3600)).toBe("60:00");
  });
});
