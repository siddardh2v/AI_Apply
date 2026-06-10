"use client";

import { useEffect, useState } from "react";

export function matchColor(score: number): string {
  if (score >= 90) return "#00F5FF"; // electric cyan
  if (score >= 75) return "#10D8A4"; // emerald
  if (score >= 50) return "#FBBF24"; // amber
  return "#FB7185"; // rose
}

export function matchLabel(score: number): string {
  if (score >= 90) return "Excellent fit";
  if (score >= 75) return "Strong fit";
  if (score >= 50) return "Possible fit";
  return "Stretch";
}

function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const to = Math.max(0, Math.min(100, Math.round(target)));
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/** Animated ring with count-up, color-coded by score range. */
export function MatchScore({ score, size = 72 }: { score: number; size?: number }) {
  const value = useCountUp(score);
  const color = matchColor(score);
  const stroke = 5;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center font-mono font-semibold"
        style={{ color }}
      >
        <span style={{ fontSize: size * 0.28 }}>{value}</span>
      </div>
    </div>
  );
}

/** Compact inline badge with count-up, for list rows. */
export function MatchPill({ score }: { score: number }) {
  const value = useCountUp(score);
  const color = matchColor(score);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-xs font-medium"
      style={{ background: `${color}1A`, color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      {value}% match
    </span>
  );
}
