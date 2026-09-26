"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { catalog } from "@/content/products";
import { Logo } from "./Logo";

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function Navbar() {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const last = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setHidden(y > 220 && y > last.current + 4 ? true : y < last.current - 4 ? false : hidden);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hidden]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (search) inputRef.current?.focus();
  }, [search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = q.trim()
    ? catalog.filter((p) => (p.name + " " + p.tagline).toLowerCase().includes(q.trim().toLowerCase()))
    : catalog;

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b bg-white/85 backdrop-blur-md transition-all duration-300 ${scrolled ? "border-line shadow-[0_6px_24px_-16px_rgba(0,0,0,.35)]" : "border-transparent"} ${hidden && !open && !search ? "-translate-y-full" : "translate-y-0"}`}
      >
        <div className="mx-auto grid h-[72px] max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 max-[359px]:px-2 sm:gap-3 md:px-8 xl:h-[84px]">
          {/* left: nav (desktop) / burger (mobile) */}
          <div className="flex items-center">
            <button
              className="-ml-2 grid h-11 w-11 cursor-pointer place-items-center rounded-lg transition hover:bg-ink/5 xl:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
            </button>
            <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
              {site.nav.map((n) => {
                const active = isActive(path, n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex h-9 items-center whitespace-nowrap rounded-md px-3 text-[12px] font-medium uppercase leading-none tracking-[0.04em] transition-all duration-200 ${
                      active ? "bg-ink font-semibold text-white" : "text-ink/80 hover:bg-ink/5 hover:text-ink"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <Logo />

          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setSearch(true)}
              aria-label="Search"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-lg transition hover:scale-110 hover:bg-ink/5"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </button>
            <Link
              href="/account"
              aria-label="My purchases"
              className="grid h-11 w-11 place-items-center rounded-lg transition hover:scale-110 hover:bg-ink/5"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" /></svg>
            </Link>
          </div>
        </div>
      </header>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-ink/50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-[61] flex w-[86%] max-w-sm flex-col bg-white p-6 shadow-2xl"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              aria-label="Menu"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button aria-label="Close menu" onClick={() => setOpen(false)} className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg hover:bg-ink/5">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                </button>
              </div>
              <nav className="mt-8 flex flex-col">
                {[...site.nav, { label: "My Purchases", href: "/account" }].map((n, i) => (
                  <motion.div key={n.href} initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.08 + i * 0.05 }}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className={`block border-b border-line py-4 text-lg font-semibold ${isActive(path, n.href) ? "text-brand" : ""}`}
                    >
                      {n.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <p className="mt-auto text-xs text-ink/50">© 2026 {site.name} · created by {site.creator}</p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* search overlay */}
      <AnimatePresence>
        {search && (
          <motion.div
            className="fixed inset-0 z-[70] bg-white/95 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog" aria-label="Search"
          >
            <div className="mx-auto max-w-2xl px-4 pt-24">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (results[0]) {
                    router.push(results[0].href);
                    setSearch(false);
                  }
                }}
                className="flex items-center gap-3 border-b-2 border-ink pb-3"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="flex-1 bg-transparent text-xl outline-none" />
                <button type="button" onClick={() => setSearch(false)} className="cursor-pointer rounded-md px-2 py-1 text-sm font-semibold hover:bg-ink/5">Close</button>
              </form>
              <ul className="mt-6 space-y-2">
                {results.map((p) => (
                  <li key={p.slug}>
                    <Link href={p.href} onClick={() => setSearch(false)} className="flex items-center justify-between rounded-xl border border-line p-4 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-md">
                      <span>
                        <span className="block font-semibold">{p.name}</span>
                        <span className="text-sm text-ink/60">{p.tagline}</span>
                      </span>
                      <span aria-hidden>→</span>
                    </Link>
                  </li>
                ))}
                {results.length === 0 && <li className="text-ink/60">No products match “{q}”.</li>}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
