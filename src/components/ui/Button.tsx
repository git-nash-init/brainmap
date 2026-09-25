"use client";
import Link from "next/link";
import { useCallback, type ComponentProps, type MouseEvent } from "react";

type Common = { variant?: "solid" | "outline" | "lime" | "ghost"; size?: "md" | "lg"; block?: boolean };
const styles = {
  solid: "bg-ink text-white",
  outline: "border-2 border-ink text-ink bg-transparent hover:bg-ink hover:text-white",
  lime: "bg-lime text-ink",
  ghost: "text-ink hover:bg-ink/5",
};

function useRipple() {
  return useCallback((e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const dot = document.createElement("span");
    dot.className = "ripple-dot";
    dot.style.left = `${e.clientX - r.left}px`;
    dot.style.top = `${e.clientY - r.top}px`;
    el.appendChild(dot);
    setTimeout(() => dot.remove(), 650);
  }, []);
}

const base =
  "btn inline-flex items-center justify-center gap-2 rounded-lg font-bold uppercase tracking-[0.08em] cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none";

function cls({ variant = "solid", size = "md", block }: Common, extra = "") {
  return `${base} ${styles[variant]} ${size === "lg" ? "h-14 px-8 text-[15px]" : "h-11 px-6 text-[13px]"} ${block ? "w-full" : ""} ${extra}`;
}

export function Button({ variant, size, block, className = "", onClick, ...rest }: Common & ComponentProps<"button">) {
  const ripple = useRipple();
  return (
    <button
      {...rest}
      className={cls({ variant, size, block }, className)}
      onClick={(e) => {
        ripple(e);
        onClick?.(e);
      }}
    />
  );
}

export function ButtonLink({ variant, size, block, className = "", href, onClick, ...rest }: Common & ComponentProps<typeof Link>) {
  const ripple = useRipple();
  return (
    <Link
      href={href}
      {...rest}
      className={cls({ variant, size, block }, className)}
      onClick={(e) => {
        ripple(e);
        onClick?.(e);
      }}
    />
  );
}
