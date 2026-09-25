"use client";
import { useReducedMotion } from "motion/react";
import { useMemo } from "react";

const colors = ["#d9f99d", "#2e7d32", "#121212", "#ff2b2b", "#facc15"];

/** Animated check + confetti. */
export function SuccessBurst() {
  const reduce = useReducedMotion();
  const bits = useMemo(
    () => Array.from({ length: 36 }, (_, i) => ({
      left: `${(i * 97) % 100}%`,
      delay: `${((i * 53) % 100) / 60}s`,
      dur: `${2.6 + ((i * 31) % 20) / 10}s`,
      dx: `${((i * 41) % 140) - 70}px`,
      color: colors[i % colors.length],
      size: 6 + (i % 4) * 2,
    })),
    [],
  );
  return (
    <div className="relative mx-auto h-28 w-28">
      {!reduce && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
          {bits.map((b, i) => (
            <span
              key={i}
              className="absolute top-0 rounded-[2px]"
              style={{ left: b.left, width: b.size, height: b.size * 1.6, background: b.color, animation: `confetti-fall ${b.dur} ${b.delay} ease-in forwards`, ["--dx" as string]: b.dx }}
            />
          ))}
        </div>
      )}
      <div className="grid h-28 w-28 place-items-center rounded-full bg-lime" style={{ animation: "pop .6s cubic-bezier(.2,.9,.3,1.3) both" }}>
        <svg viewBox="0 0 52 52" className="h-14 w-14" fill="none" stroke="#121212" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 27l8 8 16-17" strokeDasharray="50" strokeDashoffset="50" style={{ animation: "draw-check .6s .35s ease-out forwards" }} />
        </svg>
      </div>
    </div>
  );
}
