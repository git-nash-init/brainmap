"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { site } from "@/content/site";
import { Logo } from "./Logo";
import { notify } from "@/components/ui/Toaster";
import { Button } from "@/components/ui/Button";

const WAVE = "M0,64 C160,10 320,10 480,44 C640,78 800,78 960,44 C1120,10 1280,10 1440,64 L1440,100 L0,100 Z";

export function Footer() {
  const [email, setEmail] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return notify("Please enter a valid email.");
    // TODO: wire to newsletter provider
    setEmail("");
    notify("You're on the list. Welcome to Brain Map!");
  };
  return (
    <footer className="mt-24 bg-ink text-white">
      {/* animated wave divider */}
      <div className="-mt-[1px] h-14 w-full -translate-y-full overflow-hidden text-ink md:h-20" aria-hidden>
        <div className="animate-ticker-slow flex h-full w-[200%]" style={{ animationDuration: "24s" }}>
          {[0, 1].map((n) => (
            <svg key={n} viewBox="0 0 1440 100" preserveAspectRatio="none" className="h-full w-1/2 shrink-0">
              <path d={WAVE} fill="currentColor" />
            </svg>
          ))}
        </div>
      </div>
      <div className="mx-auto -mt-14 max-w-[1320px] px-4 pb-10 md:-mt-20 md:px-8">
        <div className="grid gap-12 pt-4 md:grid-cols-[1.1fr_1fr_1.4fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
              Planners you print and a private second brain you carry. Built for people who’d rather do than plan.
            </p>
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold">Quick links</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {site.footerLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-grow inline-block text-white/80 transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold">Subscribe to our newsletter</h2>
            <form onSubmit={submit} className="mt-4 max-w-md space-y-3" noValidate>
              <label className="block">
                <span className="sr-only">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  className="h-12 w-full rounded-lg border border-white/30 bg-transparent px-4 text-sm outline-none transition placeholder:text-white/50 focus:border-lime focus:ring-2 focus:ring-lime/30"
                />
              </label>
              <Button type="submit" variant="lime" block>Sign up</Button>
            </form>
          </div>
        </div>
        <div className="mt-14 border-t border-white/10 pt-6 text-center text-xs text-white/55">
          © 2026, {site.name} · created by <a href={site.creatorUrl} className="link-grow font-medium text-white/80 hover:text-white" target="_blank" rel="noopener noreferrer">{site.creator}</a>
        </div>
      </div>
    </footer>
  );
}
