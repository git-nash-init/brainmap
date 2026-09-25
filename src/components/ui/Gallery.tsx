"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState, type KeyboardEvent } from "react";

/** Product gallery: main image with arrows / keys / swipe / hover-zoom, plus a thumbnail rail. */
export function Gallery({ images, alt, sticky = true }: { images: string[]; alt: string; sticky?: boolean }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const touch = useRef<number | null>(null);
  const go = useCallback((d: number) => setI((v) => (v + d + images.length) % images.length), [images.length]);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={onKey}
      className={`outline-none ${sticky ? "lg:sticky lg:top-28" : ""}`}
      aria-roledescription="carousel"
      aria-label={`${alt} gallery`}
    >
      <div
        className="relative aspect-square w-full overflow-hidden rounded-2xl bg-mist"
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onPointerLeave={() => setZoom(null)}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={images[i]}
              alt={`${alt} — image ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 ease-out"
              style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          </motion.div>
        </AnimatePresence>
        {images.length > 1 && (
          <>
            <button aria-label="Previous image" onClick={() => go(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/90 text-xl shadow transition hover:scale-110 hover:bg-white">‹</button>
            <button aria-label="Next image" onClick={() => go(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/90 text-xl shadow transition hover:scale-110 hover:bg-white">›</button>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium text-white">{i + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, n) => (
            <button
              key={src}
              onClick={() => setI(n)}
              aria-label={`Show image ${n + 1}`}
              aria-current={n === i}
              className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all hover:-translate-y-0.5 ${n === i ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
