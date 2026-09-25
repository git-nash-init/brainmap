import Link from "next/link";
import { site } from "@/content/site";

/** b.m monogram + "Brain Map" wordmark, with a tiny credit line beneath. */
export function Logo({ tone = "dark", credit = true, className = "" }: { tone?: "dark" | "light"; credit?: boolean; className?: string }) {
  const fg = tone === "dark" ? "text-ink" : "text-white";
  return (
    <Link href="/" aria-label={`${site.name} home`} className={`group inline-flex flex-col items-start leading-none ${fg} ${className}`}>
      <span className="flex items-center gap-2">
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg font-extrabold text-[13px] tracking-tight transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 ${
            tone === "dark" ? "bg-ink text-lime" : "bg-lime text-ink"
          }`}
        >
          b<span className="text-white">.</span>m
        </span>
        <span className="font-display text-[22px] font-extrabold tracking-tight">
          Brain Map<span className="text-brand">.</span>
        </span>
      </span>
      {credit && (
        <span className={`mt-1 pl-10 text-[8.5px] font-medium uppercase tracking-[0.18em] ${tone === "dark" ? "text-ink/45" : "text-white/50"}`}>
          created by {site.creator}
        </span>
      )}
    </Link>
  );
}
