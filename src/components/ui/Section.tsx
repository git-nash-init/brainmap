import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1320px] px-4 md:px-8 ${className}`}>{children}</div>;
}

export function SectionHeading({ eyebrow, title, sub, center = true }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <Reveal className={`mb-10 ${center ? "mx-auto text-center" : ""} max-w-2xl`}>
      {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>}
      <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-[15px] leading-relaxed text-ink/70">{sub}</p>}
    </Reveal>
  );
}
