"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CHECKOUT } from "@/content/site";
import { inr, savePct, type Product } from "@/content/products";
import { Button } from "@/components/ui/Button";
import { Countdown } from "@/components/ui/Countdown";

export function goCheckout(id: keyof typeof CHECKOUT) {
  const url = CHECKOUT[id];
  // No payment link yet -> demo checkout (simulated payment that ends on the success page)
  window.location.href = !url || url === "#" ? `/checkout/demo?product=${id}` : url;
}

function SaveBadge({ pct }: { pct: number }) {
  return (
    <motion.span
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1 rounded-md bg-brand px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
    >
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor"><path d="M10.6 2 18 9.4a1.4 1.4 0 0 1 0 2L11.4 18a1.4 1.4 0 0 1-2 0L2 10.6V2.7C2 2.3 2.3 2 2.7 2h7.9ZM6 6a1 1 0 1 0 0-.01V6Z" /></svg>
      Save {pct}%
    </motion.span>
  );
}

export function BuyBox({
  product, kicker, bullets, timer = false, watching = false, note,
}: {
  product: Product;
  kicker?: string;
  bullets?: string[];
  timer?: boolean;
  watching?: boolean;
  note?: string;
}) {
  const [vi, setVi] = useState(product.variants.length > 1 ? 1 : 0);
  const [qty, setQty] = useState(1);
  const [stuck, setStuck] = useState(false);
  const [viewers, setViewers] = useState(4);
  const anchor = useRef<HTMLDivElement>(null);
  const v = product.variants[vi];

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!watching) return;
    const t = setInterval(() => setViewers((n) => Math.max(2, Math.min(9, n + (Math.random() > 0.5 ? 1 : -1)))), 4200);
    return () => clearInterval(t);
  }, [watching]);

  return (
    <div>
      {kicker && (
        <span className="inline-block rounded-full bg-lime px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink">{kicker}</span>
      )}
      <h1 className="mt-3 font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-4xl">{product.name}</h1>
      <p className="mt-2 text-[15px] text-ink/70">{product.tagline}</p>
      {bullets && (
        <ul className="mt-4 space-y-1.5 text-[14px]">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2"><span aria-hidden>{b.slice(0, 2)}</span><span>{b.slice(2).trim()}</span></li>
          ))}
        </ul>
      )}

      {timer && (
        <div className="mt-5 rounded-xl border border-line bg-mist p-4">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-alert">
            <Image src="/images/fire.png" alt="" width={18} height={18} /> Offer price ends today
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold">Limited time offer! ends in</p>
            <Countdown />
          </div>
        </div>
      )}

      {/* variant picker */}
      <fieldset className="mt-6 min-w-0">
        <legend className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/60">
          {product.variants.length > 1 ? "Print it. Use it. Repeat." : "Your plan"}
        </legend>
        <div className="mt-3 space-y-3">
          {product.variants.map((x, i) => {
            const on = i === vi;
            return (
              <label
                key={x.id}
                className={`relative flex cursor-pointer items-center gap-4 rounded-xl border-2 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  on ? "border-ink bg-white shadow-md" : "border-line bg-white/60"
                }`}
              >
                <input type="radio" name="variant" className="sr-only" checked={on} onChange={() => setVi(i)} />
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${on ? "border-ink" : "border-ink/30"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full bg-ink transition-transform ${on ? "scale-100" : "scale-0"}`} />
                </span>
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist">
                  <Image src={x.image} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold uppercase tracking-wide">{x.label}</span>
                  <span className="block truncate text-xs text-ink/60">{x.sub}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[15px] font-bold">{inr(x.price)}</span>
                  <span className="block text-xs text-ink/45 line-through">{inr(x.mrp)}</span>
                </span>
                {x.badge && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {x.badge}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* price */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <AnimatePresence mode="popLayout">
          <motion.span key={v.id + qty} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="text-2xl font-bold">
            {inr(v.price * qty)}
          </motion.span>
        </AnimatePresence>
        <span className="text-base font-semibold text-ink/45 line-through">{inr(v.mrp * qty)}</span>
        <SaveBadge pct={savePct(v.price, v.mrp)} />
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="inline-flex items-center rounded-lg border border-ink/20" role="group" aria-label="Quantity">
          <button aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 cursor-pointer place-items-center text-lg transition hover:bg-ink/5 disabled:opacity-30" disabled={qty <= 1}>−</button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
          <button aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(9, q + 1))} className="grid h-11 w-11 cursor-pointer place-items-center text-lg transition hover:bg-ink/5">+</button>
        </div>
      </div>

      <div ref={anchor} className="mt-5 grid gap-3">
        <Button size="lg" block className="animate-pulse-ring" onClick={() => goCheckout(v.id)}>
          Buy now · {inr(v.price * qty)}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-ink/60">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor"><path d="M10 1 3 4v5c0 4.4 2.9 8.1 7 10 4.1-1.9 7-5.6 7-10V4l-7-3Z" /></svg>
          Secure checkout · Instant access after payment
        </p>
      </div>

      {watching && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime/60 px-3 py-1.5 text-xs font-medium">
          <span className="animate-blink h-2 w-2 rounded-full bg-brand" />
          <motion.b key={viewers} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{viewers}</motion.b> people are buying right now
        </p>
      )}
      {note && <p className="mt-4 text-xs leading-relaxed text-ink/60">{note}</p>}

      {/* sticky bar */}
      <AnimatePresence>
        {stuck && (
          <motion.div
            initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 shadow-[0_-10px_30px_-12px_rgba(0,0,0,.25)] backdrop-blur"
          >
            <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-3 md:px-8">
              <span className="relative hidden h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-mist sm:block"><Image src={v.image} alt="" fill sizes="44px" className="object-cover" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold uppercase">{product.name}</p>
                <p className="text-xs"><b>{inr(v.price)}</b> <span className="text-ink/45 line-through">{inr(v.mrp)}</span> <span className="font-bold text-brand">Save {savePct(v.price, v.mrp)}%</span></p>
              </div>
              {product.variants.length > 1 && (
                <select
                  aria-label="Choose variant"
                  value={vi}
                  onChange={(e) => setVi(Number(e.target.value))}
                  className="hidden h-11 rounded-lg border border-ink/20 bg-white px-3 text-xs font-semibold md:block"
                >
                  {product.variants.map((x, i) => <option key={x.id} value={i}>{x.label}</option>)}
                </select>
              )}
              <Button onClick={() => goCheckout(v.id)}>Buy now</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
