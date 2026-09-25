"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";

const field = "h-12 w-full rounded-lg border border-ink/25 bg-white px-4 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-lime";

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

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
    if (busy) return;
    setBusy(true);
    setMsg(null);
    let leaving = false;
    try {
      const { error } = await withTimeout(createClient().auth.signInWithPassword({ email: email.trim(), password }), 20000);
      if (error) {
        setMsg({ ok: false, text: /invalid login|credentials/i.test(error.message) ? "Wrong email or password." : error.message });
        return;
      }
      leaving = true;
      router.replace(dest);
      router.refresh();
      // safety net: if navigation stalls, don't leave the button spinning forever
      setTimeout(() => setBusy(false), 8000);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error && err.message === "timeout" ? "Sign-in is taking too long. Check your connection and try again." : "Couldn’t reach the sign-in service. Please try again." });
    } finally {
      if (!leaving) setBusy(false); // on success the spinner stays until the redirect (or the safety net above)
    }
  }

  async function forgot() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg({ ok: false, text: "Enter your email above first." });
    setBusy(true);
    try {
      await withTimeout(createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/account/reset` }), 20000);
      setMsg({ ok: true, text: "If that email has an account, a reset link is on its way." });
    } catch {
      setMsg({ ok: false, text: "Couldn’t send the reset email right now. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={signIn} className="mt-8 space-y-4">
      <label className="block text-sm font-semibold">Email
        <input className={`${field} mt-1.5`} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block text-sm font-semibold">Password
        <div className="mt-1.5"><PasswordInput className={field} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      </label>
      {msg && <p role="alert" className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-lime/60" : "bg-alert/10 text-alert"}`}>{msg.text}</p>}
      <Button type="submit" size="lg" block disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      <button type="button" onClick={forgot} disabled={busy} className="link-grow cursor-pointer text-sm text-ink/70 hover:text-ink disabled:opacity-50">Forgot password?</button>
    </form>
  );
}
