"use client";
import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function CountUp({ to, suffix = "", duration = 1.6 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, to, { duration, ease: [0, 0, 0.3, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView, to, duration, reduce]);
  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

/** Circular progress stat (e.g. 92%). */
export function StatRing({ value, size = 64 }: { value: number; size?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });
  const r = 28;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg ref={ref} viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(46,125,50,.15)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke="var(--green)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={inView ? c * (1 - value / 100) : c}
          style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0,0,.3,1)" }}
        />
      </svg>
      <span className="text-[15px] font-bold text-brand">
        <CountUp to={value} suffix="%" />
      </span>
    </div>
  );
}
