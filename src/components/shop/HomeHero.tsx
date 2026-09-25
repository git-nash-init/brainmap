"use client";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { PhoneMockup } from "./PhoneMockup";

const words = ["Plan", "it", "on", "paper."];
const words2 = ["Keep", "it", "in", "your", "brain."];

export function HomeHero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70 grad-anim" style={{ backgroundImage: "radial-gradient(60% 60% at 15% 20%, rgba(46,125,50,.45), transparent 70%), radial-gradient(50% 50% at 90% 80%, rgba(255,43,43,.28), transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[.08]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

      <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 py-16 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <div>
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
            <span className="animate-blink h-1.5 w-1.5 rounded-full bg-lime" /> New · Brain Map OS is live
          </motion.span>
          <h1 className="mt-6 font-display text-[clamp(2.6rem,7vw,5.4rem)] font-extrabold leading-[0.98] tracking-tight">
            <span className="block">
              {words.map((w, i) => (
                <motion.span key={w + i} className="inline-block" initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.09, duration: 0.7, ease: [0, 0, 0.3, 1] }}>{w}{" "}</motion.span>
              ))}
            </span>
            <span className="block text-lime">
              {words2.map((w, i) => (
                <motion.span key={w + i} className="inline-block" initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55 + i * 0.09, duration: 0.7, ease: [0, 0, 0.3, 1] }}>{w}{" "}</motion.span>
              ))}
            </span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="mt-6 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
            Printable planners that make consistency visible — and a private, encrypted second brain that replaces ten apps. One brand, two ways to run your life.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.25 }} className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/products/bundle" variant="lime" size="lg">Get the bundle</ButtonLink>
            <ButtonLink href="/collections/all" variant="outline" size="lg" className="!border-white/60 !text-white hover:!bg-white hover:!text-ink">Browse all</ButtonLink>
          </motion.div>
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/70">
            {["Instant access", "End-to-end encrypted", "Print or use on phone"].map((t) => (
              <li key={t} className="flex items-center gap-2"><span className="grid h-4 w-4 place-items-center rounded-full bg-lime text-[9px] font-bold text-ink">✓</span>{t}</li>
            ))}
          </motion.ul>
        </div>

        <div className="relative mx-auto h-[420px] w-full max-w-[560px] sm:h-[500px]">
          <motion.div style={{ y: y1 }} className="absolute left-0 top-6 w-[62%] -rotate-6 overflow-hidden rounded-2xl border border-white/15 shadow-2xl">
            <div className="animate-float">
              <Image src="/images/habit-main.png" alt="Brain Map monthly habit tracker printable" width={520} height={520} priority sizes="(min-width:1024px) 340px, 60vw" className="h-auto w-full" />
            </div>
          </motion.div>
          <motion.div style={{ y: y2 }} className="absolute right-0 top-0 w-[46%] min-w-[190px] rotate-3">
            <div className="animate-float" style={{ animationDelay: "-2.5s" }}>
              <PhoneMockup className="!w-full" />
            </div>
          </motion.div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.6, type: "spring" }} className="absolute bottom-4 left-[38%] rounded-2xl bg-lime px-4 py-3 text-ink shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest">Bundle saves</p>
            <p className="font-display text-2xl font-extrabold">75%</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
