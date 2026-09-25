"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-runs the server page every few seconds (used while a payment is still being confirmed). */
export function AutoRefresh({ seconds = 4 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
