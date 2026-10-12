import { useEffect, useState } from "react";
import { remainingSeconds } from "./countdown";

// endAt is a Date.now()-style timestamp; using an absolute end time (rather
// than decrementing a counter) keeps the display correct even if the tab was
// throttled or backgrounded and missed ticks.
export function useCountdown(endAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endAt]);

  return endAt ? remainingSeconds(endAt, now) : 0;
}
