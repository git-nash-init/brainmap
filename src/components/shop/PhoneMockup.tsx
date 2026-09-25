"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const habits = ["Drink 3L water", "Workout", "Read 20 pages", "Meditate"];

function Home() {
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-zinc-400">Good morning, Aarav 👋</p>
      <div className="relative mx-auto grid h-28 w-28 place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#222" strokeWidth="9" />
          <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#ff2b2b" strokeWidth="9" strokeLinecap="round" strokeDasharray="264" initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 * 0.18 }} transition={{ duration: 1.4, ease: "easeOut" }} />
        </svg>
        <div className="text-center"><p className="text-2xl font-extrabold text-white">82</p><p className="text-[8px] tracking-widest text-zinc-400">LIFE SCORE</p></div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[["5", "Tasks"], ["3/4", "Habits"], ["12", "Streak"]].map(([a, b]) => (
          <div key={b} className="rounded-lg bg-zinc-900 py-1.5"><p className="text-xs font-bold text-white">{a}</p><p className="text-[8px] text-zinc-500">{b}</p></div>
        ))}
      </div>
    </div>
  );
}

function Habits() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-white">Habit Tracker</p>
      {habits.map((h, i) => (
        <motion.div key={h} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-2 rounded-lg bg-zinc-900 p-2">
          <span className={`grid h-4 w-4 place-items-center rounded-md text-[9px] ${i < 3 ? "bg-green-500 text-black" : "border border-zinc-600"}`}>{i < 3 ? "✓" : ""}</span>
          <span className="flex-1 text-[10px] text-zinc-200">{h}</span>
          <span className="text-[9px] text-orange-400">🔥{12 - i * 3}</span>
        </motion.div>
      ))}
      <div className="flex gap-[3px] pt-1">
        {Array.from({ length: 21 }).map((_, i) => <span key={i} className={`h-2.5 flex-1 rounded-sm ${i % 5 === 3 ? "bg-zinc-800" : "bg-green-500/80"}`} />)}
      </div>
    </div>
  );
}

function Money() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-white">Finance</p>
      <div className="rounded-xl bg-gradient-to-br from-red-600/30 to-purple-600/30 p-3"><p className="text-[9px] text-zinc-300">Net worth</p><p className="text-lg font-extrabold text-white">₹4,82,300</p></div>
      {[["Income", "₹85,000", "text-green-400"], ["Expenses", "₹41,200", "text-red-400"], ["Savings", "₹43,800", "text-blue-400"]].map(([a, b, c]) => (
        <div key={a} className="flex justify-between rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[10px]"><span className="text-zinc-400">{a}</span><span className={`font-bold ${c}`}>{b}</span></div>
      ))}
    </div>
  );
}

const screens = [Home, Habits, Money];

export function PhoneMockup({ className = "" }: { className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % screens.length), 3600);
    return () => clearInterval(t);
  }, []);
  const S = screens[i];
  return (
    <div className={`relative mx-auto aspect-[9/18.5] w-[230px] rounded-[2.4rem] border-[7px] border-zinc-800 bg-black p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)] ${className}`} aria-hidden>
      <div className="absolute left-1/2 top-1.5 h-4 w-16 -translate-x-1/2 rounded-full bg-zinc-900" />
      <div className="mt-5 h-[calc(100%-3.6rem)] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
            <S />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute inset-x-3 bottom-3 flex justify-around rounded-2xl bg-zinc-900/90 py-2 text-[10px] text-zinc-400">
        {["⌂", "◎", "＋", "✓", "✎"].map((g, n) => <span key={n} className={n === 2 ? "-mt-3 grid h-7 w-7 place-items-center rounded-full bg-[#ff2b2b] text-white shadow-[0_0_14px_#ff2b2b88]" : n === i ? "text-white" : ""}>{g}</span>)}
      </div>
    </div>
  );
}
