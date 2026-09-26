"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: ((...a: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
    __bmPixels?: Record<string, boolean>;
  }
}

/** Meta's standard base code, run once per pixel id. */
function loadPixel(id: string) {
  const w = window;
  w.__bmPixels = w.__bmPixels || {};
  if (w.__bmPixels[id]) return;
  w.__bmPixels[id] = true;
  if (!w.fbq) {
    const n = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args);
      else (n.queue as unknown[]).push(args);
    } as NonNullable<Window["fbq"]>;
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    w.fbq = n;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }
  w.fbq!("init", id);
  w.fbq!("track", "PageView");
}

/**
 * Loads the Meta Pixel only when the URL hash matches (e.g. "#buy"): on landing with that hash
 * (an ad linking to /page#buy) and whenever the hash changes to it (a button linking to #buy).
 */
export function MetaPixelOnHash({ id, hash }: { id: string; hash: string }) {
  useEffect(() => {
    const check = () => { if (window.location.hash === hash) loadPixel(id); };
    check();
    // Next's <Link href="#buy"> changes the hash with history.pushState, which fires no "hashchange" event: watch it too.
    const push = window.history.pushState, replace = window.history.replaceState;
    window.history.pushState = function (...a: Parameters<History["pushState"]>) { const r = push.apply(this, a); setTimeout(check, 0); return r; };
    window.history.replaceState = function (...a: Parameters<History["replaceState"]>) { const r = replace.apply(this, a); setTimeout(check, 0); return r; };
    window.addEventListener("hashchange", check);
    window.addEventListener("popstate", check);
    return () => {
      window.history.pushState = push;
      window.history.replaceState = replace;
      window.removeEventListener("hashchange", check);
      window.removeEventListener("popstate", check);
    };
  }, [id, hash]);
  return null;
}
