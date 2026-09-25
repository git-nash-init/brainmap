"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { catalog, inr, type Variant } from "@/content/products";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const input = "h-12 w-full rounded-lg border border-ink/25 bg-white px-4 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-lime";

export function DemoCheckout() {
  const router = useRouter();
  const key = useSearchParams().get("product") ?? "";
  const found = catalog.flatMap((p) => p.variants.map((v) => ({ p, v }))).find((x) => x.v.id === key);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!found) {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold">Nothing to check out</h1>
        <p className="mt-2 text-ink/65">Pick a product first.</p>
        <Link href="/collections/all" className="link-grow mt-4 inline-block font-semibold">Browse products →</Link>
      </div>
    );
  }
  const { p, v } = found as { p: (typeof catalog)[number]; v: Variant };

  async function pay(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (password.length < 8) return setErr("Choose a password with at least 8 characters.");
    setBusy(true);
    await new Promise((r) => setTimeout(r, 1600)); // pretend the payment is processing
    const res = await fetch("/api/checkout/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product: v.id, email, password }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); return setErr(json.error ?? "Something went wrong."); }
    if (json.orderId) {
      // sign the buyer in so "My Purchases" opens straight away (no-op if they already had another password)
      await createClient().auth.signInWithPassword({ email: email.trim(), password }).catch(() => null);
      router.replace(`/checkout/success?order=${json.orderId}`);
    } else {
      router.replace(`/checkout/success?demo=${encodeURIComponent(v.id)}`);
    }
    router.refresh();
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
      <form onSubmit={pay} className="space-y-4" noValidate>
        <p className="inline-block rounded-full bg-lime px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]">Demo checkout · no real payment</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Complete your order</h1>
        <label className="block text-sm font-semibold">Email
          <input className={`${input} mt-1.5`} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <label className="block text-sm font-semibold">Create a password
          <input className={`${input} mt-1.5`} type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters" />
          <span className="mt-1 block text-xs font-normal text-ink/55">You’ll use this to sign in to My Purchases.</span>
        </label>
        <div className="rounded-xl border border-dashed border-ink/30 p-4 text-sm text-ink/70">
          💳 Payment is simulated in demo mode — <b>no card details are collected</b> and nothing is charged.
        </div>
        {err && <p role="alert" className="rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">{err}</p>}
        <Button type="submit" size="lg" block disabled={busy}>{busy ? "Processing payment…" : `Pay ${inr(v.price)} (demo)`}</Button>
      </form>

      <aside className="h-fit rounded-2xl border border-line bg-mist p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/55">Order summary</p>
        <div className="mt-4 flex gap-4">
          <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white"><Image src={v.image} alt="" fill sizes="64px" className="object-cover" /></span>
          <div className="min-w-0">
            <p className="font-bold leading-snug">{p.name}</p>
            <p className="text-xs text-ink/60">{v.label}</p>
          </div>
        </div>
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-ink/60">Price</dt><dd><s className="mr-2 text-ink/40">{inr(v.mrp)}</s>{inr(v.price)}</dd></div>
          <div className="flex justify-between font-bold"><dt>Total</dt><dd>{inr(v.price)}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
