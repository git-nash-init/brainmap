import Link from "next/link";
import { site } from "@/content/site";

/** b.m monogram + "Brain Map" wordmark, with a tiny credit line beneath. */
export function Logo({ tone = "dark", credit = true, className = "" }: { tone?: "dark" | "light"; credit?: boolean; className?: string }) {
  const fg = tone === "dark" ? "text-ink" : "text-white";
  return (
    <Link href="/" aria-label={`${site.name} home`} className={`group inline-flex flex-col items-start leading-none ${fg} ${className}`}>
      <span className="flex items-center gap-1.5 sm:gap-2">
        <span
          className={`grid h-7 w-7 place-items-center rounded-lg text-[11px] font-extrabold tracking-tight sm:h-8 sm:w-8 sm:text-[13px] transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 ${
            tone === "dark" ? "bg-ink text-lime" : "bg-lime text-ink"
          }`}
        >
          b<span className="text-white">.</span>m
        </span>
        <span className="whitespace-nowrap font-display text-[17px] font-extrabold tracking-tight sm:text-[22px]">
          Brain Map<span className="text-brand">.</span>
        </span>
      </span>
      {credit && (
        <span className={`mt-1 whitespace-nowrap max-[359px]:hidden pl-[34px] text-[6.5px] font-medium uppercase tracking-[0.1em] sm:pl-10 sm:text-[8.5px] sm:tracking-[0.18em] ${tone === "dark" ? "text-ink/45" : "text-white/50"}`}>
          created by {site.creator}
        </span>
      )}
    </Link>
  );
}
