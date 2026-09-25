"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const field = "h-12 w-full rounded-lg border border-ink/25 bg-white px-4 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-lime";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      setMsg({ ok: false, text: "Wrong email or password." });
      return;
    }
    router.replace(dest);
    router.refresh();
  }

  async function forgot() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg({ ok: false, text: "Enter your email above first." });
    setBusy(true);
    await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/account/reset` });
    setBusy(false);
    setMsg({ ok: true, text: "If that email has an account, a reset link is on its way." });
  }

  return (
    <form onSubmit={signIn} className="mt-8 space-y-4">
      <label className="block text-sm font-semibold">Email
        <input className={`${field} mt-1.5`} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block text-sm font-semibold">Password
        <input className={`${field} mt-1.5`} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {msg && <p role="alert" className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-lime/60" : "bg-alert/10 text-alert"}`}>{msg.text}</p>}
      <Button type="submit" size="lg" block disabled={busy}>{busy ? "Please wait…" : "Sign in"}</Button>
      <button type="button" onClick={forgot} className="link-grow cursor-pointer text-sm text-ink/70 hover:text-ink">Forgot password?</button>
    </form>
  );
}
