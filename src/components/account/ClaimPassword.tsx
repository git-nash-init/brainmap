"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";

/** New customer: choose a password, get signed in, land on the purchase. */
export function ClaimPassword({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) return setErr("Use at least 8 characters.");
    setBusy(true);
    const res = await fetch("/api/payments/claim", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); return setErr(json.error ?? "Something went wrong."); }
    await createClient().auth.signInWithPassword({ email: json.email, password: pw });
    router.replace(`/account/purchases/${orderId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-8 max-w-sm rounded-2xl border-2 border-ink bg-lime/40 p-5 text-left">
      <h2 className="font-display text-xl font-extrabold">One last step: create your password</h2>
      <p className="mt-1 text-sm text-ink/70">We made your account from your checkout email. Choose a password to open your purchases anytime.</p>
      <div className="mt-4"><PasswordInput autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password (8+ characters)" className="h-12 w-full rounded-lg border border-ink/25 bg-white px-4 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-lime" /></div>
      {err && <p role="alert" className="mt-2 text-sm text-alert">{err}</p>}
      <div className="mt-4"><Button type="submit" size="lg" block disabled={busy}>{busy ? "Saving…" : "Save password & open my purchases"}</Button></div>
    </form>
  );
}
