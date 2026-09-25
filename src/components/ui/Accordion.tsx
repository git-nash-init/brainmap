"use client";
import { useId, useState, type ReactNode } from "react";

export type AccItem = { q: ReactNode; a: ReactNode; icon?: ReactNode };

export function Accordion({ items, single = true, defaultOpen = -1, className = "" }: { items: AccItem[]; single?: boolean; defaultOpen?: number; className?: string }) {
  const [open, setOpen] = useState<number[]>(defaultOpen >= 0 ? [defaultOpen] : []);
  const id = useId();
  const toggle = (i: number) =>
    setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : single ? [i] : [...o, i]));
  return (
    <div className={`divide-y divide-line ${className}`}>
      {items.map((it, i) => {
        const isOpen = open.includes(i);
        return (
          <div key={i}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${id}-p${i}`}
                id={`${id}-b${i}`}
                onClick={() => toggle(i)}
                className="group flex w-full cursor-pointer items-center gap-3 py-4 text-left text-[15px] font-semibold transition-colors hover:text-brand"
              >
                {it.icon}
                <span className="flex-1">{it.q}</span>
                <svg viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="m4 7 6 6 6-6" />
                </svg>
              </button>
            </h3>
            <div id={`${id}-p${i}`} role="region" aria-labelledby={`${id}-b${i}`} className="acc-panel" data-open={isOpen}>
              <div>
                <div className="pb-5 text-[14px] leading-relaxed text-ink/75">{it.a}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
