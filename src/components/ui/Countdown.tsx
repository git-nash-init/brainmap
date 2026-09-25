"use client";
import { useEffect, useState } from "react";

/** "Offer ends today" countdown to local midnight. */
export function Countdown({ className = "" }: { className?: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      setLeft(Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  const s = left ?? 0;
  const parts: [string, string][] = [
    [p(Math.floor(s / 3600)), "Hrs"],
    [p(Math.floor((s % 3600) / 60)), "Mins"],
    [p(s % 60), "Secs"],
  ];
  return (
    <div className={`flex items-start gap-1.5 ${className}`} role="timer">
      {parts.map(([v, l], i) => (
        <div key={l} className="flex items-start gap-1.5">
          <div className="flex flex-col items-center">
            <span className="grid h-10 w-11 place-items-center rounded-md bg-ink text-lg font-bold tabular-nums text-white">{left === null ? "--" : v}</span>
            <span className="mt-0.5 text-[9px] font-medium uppercase text-ink/50">{l}</span>
          </div>
          {i < 2 && <span className="pt-1.5 text-lg font-bold">:</span>}
        </div>
      ))}
    </div>
  );
}
