import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 md:py-24">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-ink/65">Sign in to see your purchases, download templates and get your Brain Map OS login.</p>
      <Suspense><LoginForm /></Suspense>
    </div>
  );
}
