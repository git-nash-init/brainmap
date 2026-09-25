import type { ReactNode } from "react";

/** Infinite horizontal ticker (CSS only; pauses on hover). Content is duplicated for a seamless loop. */
export function Marquee({ children, className = "", slow = false }: { children: ReactNode; className?: string; slow?: boolean }) {
  return (
    <div className={`pause-on-hover overflow-hidden ${className}`}>
      <div className={`flex w-max ${slow ? "animate-ticker-slow" : "animate-ticker"}`}>
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
