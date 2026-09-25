"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** Scroll-in reveal: fade + rise, same easing as the original theme. */
export function Reveal({
  children, delay = 0, y = 28, className = "", as = "div",
}: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "section" | "li" }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0, 0, 0.3, 1] }}
    >
      {children}
    </M>
  );
}

export function Stagger({ children, className = "", gap = 0.08 }: { children: ReactNode; className?: string; gap?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0, 0, 0.3, 1] } } }}
    >
      {children}
    </motion.div>
  );
}
