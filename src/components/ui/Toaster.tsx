"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export function notify(message: string) {
  window.dispatchEvent(new CustomEvent("bm:toast", { detail: message }));
}

export function Toaster() {
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = (e: Event) => {
      setMsg({ id: Date.now(), text: (e as CustomEvent<string>).detail });
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 3200);
    };
    window.addEventListener("bm:toast", on);
    return () => {
      window.removeEventListener("bm:toast", on);
      clearTimeout(t);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 lg:bottom-8" role="status" aria-live="polite">
      <AnimatePresence>
        {msg && (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-auto max-w-sm rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white shadow-2xl"
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
