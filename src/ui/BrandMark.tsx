import { bpmColor } from "./bpmColor";

// 12 radial bars swept from steady to peak color, standing in for a BPM burst.
export function BrandMark({ size = 52 }: { size?: number }) {
  const bars = Array.from({ length: 12 }, (_, i) => {
    const deg = i * 30;
    const rad = ((deg - 90) * Math.PI) / 180;
    const t = (1 + Math.cos((deg * Math.PI) / 180)) / 2;
    const innerR = 18;
    const outerR = innerR + 10 + t * 16;
    return {
      x1: 50 + innerR * Math.cos(rad),
      y1: 50 + innerR * Math.sin(rad),
      x2: 50 + outerR * Math.cos(rad),
      y2: 50 + outerR * Math.sin(rad),
      color: bpmColor(t, 0, 1),
    };
  });

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {bars.map((b, i) => (
        <line
          key={i}
          x1={b.x1}
          y1={b.y1}
          x2={b.x2}
          y2={b.y2}
          stroke={b.color}
          strokeWidth={7}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
