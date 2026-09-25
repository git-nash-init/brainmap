"use client";
import { useState } from "react";
import { notify } from "@/components/ui/Toaster";

/** Read-only value with copy button (and optional reveal for secrets). */
export function CopyField({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [show, setShow] = useState(!secret);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      notify(`${label} copied`);
    } catch {
      notify("Copy failed — select and copy manually");
    }
  }
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/55">{label}</p>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-white p-1.5 pl-3">
        <code className="flex-1 select-all truncate font-mono text-sm">{show ? value : "•".repeat(Math.min(value.length, 12))}</code>
        {secret && (
          <button type="button" onClick={() => setShow((s) => !s)} className="cursor-pointer rounded-md px-2 py-1.5 text-xs font-semibold transition hover:bg-ink/5">{show ? "Hide" : "Show"}</button>
        )}
        <button type="button" onClick={copy} className="cursor-pointer rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand">Copy</button>
      </div>
    </div>
  );
}
