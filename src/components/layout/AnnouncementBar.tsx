"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { site } from "@/content/site";

export function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % site.announcements.length), 3800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative z-40 h-11 overflow-hidden bg-ink text-white" role="region" aria-label="Announcements">
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -18, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0, 0, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center px-4 text-center text-[11px] font-bold tracking-[0.12em] sm:text-sm"
        >
          {site.announcements[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
