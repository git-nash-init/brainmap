"use client";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { catalog, inr, type Variant } from "@/content/products";
import { Button } from "@/components/ui/Button";

const input = "h-12 w-full rounded-lg border border-ink/25 bg-white px-4 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-lime";

export function PayCheckout() {
  const key = useSearchParams().get("product") ?? "";
  const found = catalog.flatMap((p) => p.variants.map((v) => ({ p, v }))).find((x) => x.v.id === key);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!found) {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold">Nothing to check out</h1>
        <Link href="/collections/all" className="link-grow mt-4 inline-block font-semibold">Browse products →</Link>
      </div>
    );
  }
  const { p, v } = found as { p: (typeof catalog)[number]; v: Variant };

  async function pay(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await fetch("/api/payments/easebuzz/initiate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product: v.id, name, email, phone }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.url) { setBusy(false); return setErr(json.error ?? "Could not start the payment. Please try again."); }
    window.location.assign(json.url); // Easebuzz hosted payment page (UPI, cards, netbanking, wallets)
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
      <form onSubmit={pay} className="space-y-4" noValidate>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Complete your order</h1>
        <label className="block text-sm font-semibold">Full name
          <input className={`${input} mt-1.5`} required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-sm font-semibold">Email
          <input className={`${input} mt-1.5`} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <span className="mt-1 block text-xs font-normal text-ink/55">Your purchases are linked to this email — use the one you’ll sign in with.</span>
        </label>
        <label className="block text-sm font-semibold">Mobile number
          <input className={`${input} mt-1.5`} type="tel" required inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" />
        </label>
        {err && <p role="alert" className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{err}</p>}
        <Button type="submit" size="lg" block disabled={busy}>{busy ? "Opening secure payment…" : `Pay ${inr(v.price)} securely`}</Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-ink/55">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor"><path d="M10 1 3 4v5c0 4.4 2.9 8.1 7 10 4.1-1.9 7-5.6 7-10V4l-7-3Z" /></svg>
          Payments are processed by Easebuzz. We never see or store your card details.
        </p>
      </form>

      <aside className="h-fit rounded-2xl border border-line bg-mist p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/55">Order summary</p>
        <div className="mt-4 flex gap-4">
          <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white"><Image src={v.image} alt="" fill sizes="64px" className="object-cover" /></span>
          <div className="min-w-0"><p className="font-bold leading-snug">{p.name}</p><p className="text-xs text-ink/60">{v.label}</p></div>
        </div>
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-ink/60">Price</dt><dd><s className="mr-2 text-ink/40">{inr(v.mrp)}</s>{inr(v.price)}</dd></div>
          <div className="flex justify-between font-bold"><dt>Total</dt><dd>{inr(v.price)}</dd></div>
        </dl>
        <p className="mt-4 text-xs text-ink/55">Instant access after payment. The amount charged is always our current price, checked on the server.</p>
      </aside>
    </div>
  );
}
