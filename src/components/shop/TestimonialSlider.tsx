"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type Review = { name: string; text: string; image?: string };

/** Snapping review carousel: equal-height cards, dots per reachable position, autoplay that loops. */
export function TestimonialSlider({ items }: { items: Review[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [pages, setPages] = useState(items.length);
  const paused = useRef(false);

  const step = useCallback(() => {
    const el = ref.current;
    if (!el || !el.children[0]) return 0;
    const a = el.children[0] as HTMLElement;
    const b = el.children[1] as HTMLElement | undefined;
    return b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
  }, []);

  const measure = useCallback(() => {
    const el = ref.current;
    const s = step();
    if (!el || !s) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setPages(Math.max(1, Math.round(maxScroll / s) + 1));
  }, [step]);

  const goTo = useCallback((n: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: n * step(), behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const onScroll = () => {
      const s = step();
      if (s) setI(Math.min(pages - 1, Math.round(el.scrollLeft / s)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [measure, step, pages]);

  useEffect(() => {
    const t = setInterval(() => {
      if (!paused.current) goTo(i + 1 >= pages ? 0 : i + 1);
    }, 5500);
    return () => clearInterval(t);
  }, [i, pages, goTo]);

  return (
    <div onPointerEnter={() => (paused.current = true)} onPointerLeave={() => (paused.current = false)}>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto px-4 pb-2 pt-5 md:mx-0 md:px-0">
        {items.map((r) => (
          <figure key={r.name} className="relative flex w-[85%] shrink-0 snap-start flex-col rounded-2xl border border-line bg-white transition-shadow hover:shadow-xl sm:w-[46%] lg:w-[calc((100%-2.5rem)/3)]">
            {/* equal-height visual block: photo, or a quote panel when there is none */}
            <div className="zoom-img relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-mist">
              {r.image ? (
                <Image src={r.image} alt="" fill sizes="(min-width:1024px) 33vw, 85vw" className="object-cover" />
              ) : (
                <div className="grid h-full place-items-center bg-lime/50">
                  <span aria-hidden className="font-display text-7xl font-extrabold leading-none text-brand/70">“</span>
                </div>
              )}
            </div>
            <div className="relative flex flex-1 flex-col p-5">
              <span aria-hidden className="absolute -top-4 right-5 grid h-9 w-9 place-items-center rounded-full bg-brand pt-1.5 text-2xl font-bold leading-none text-white shadow-md">”</span>
              <p className="text-amber-500" aria-label="5 out of 5 stars">★★★★★</p>
              <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-ink/80">{r.text}</blockquote>
              <figcaption className="mt-4 text-sm font-bold">{r.name}</figcaption>
            </div>
          </figure>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: pages }, (_, n) => (
          <button key={n} aria-label={`Show reviews ${n + 1}`} aria-current={n === i} onClick={() => goTo(n)} className={`h-2 cursor-pointer rounded-full transition-all ${n === i ? "w-6 bg-ink" : "w-2 bg-ink/25 hover:bg-ink/50"}`} />
        ))}
      </div>
    </div>
  );
}
