"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function ResetPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const sb = createClient();
    const { data } = sb.auth.onAuthStateChange((ev) => {
      if (ev === "PASSWORD_RECOVERY" || ev === "SIGNED_IN") setReady(true);
    });
    sb.auth.getSession().then(({ data: s }) => s.session && setReady(true));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setErr("Use at least 8 characters.");
    const { error } = await createClient().auth.updateUser({ password: pw });
    if (error) return setErr(error.message);
    router.replace("/account");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 md:py-24">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Set a new password</h1>
      {!ready ? (
        <p className="mt-4 text-sm text-ink/65">Open this page from the link in your email.</p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <PasswordInput autoComplete="new-password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-12 w-full rounded-lg border border-ink/25 px-4 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-lime" />
          {err && <p role="alert" className="text-sm text-alert">{err}</p>}
          <Button type="submit" size="lg" block>Save password</Button>
        </form>
      )}
    </div>
  );
}
