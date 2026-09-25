import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { easebuzzConfigured } from "@/lib/payments";
import { DemoCheckout } from "./DemoCheckout";

export const dynamic = "force-dynamic"; // depends on runtime env (Easebuzz configured or not)
export const metadata: Metadata = { title: "Checkout (demo)", robots: { index: false } };

export default async function DemoCheckoutPage({ searchParams }: PageProps<"/checkout/demo">) {
  if (easebuzzConfigured()) {
    const sp = await searchParams;
    redirect(`/checkout/pay?product=${typeof sp.product === "string" ? encodeURIComponent(sp.product) : ""}`);
  }
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 md:py-16">
      <Suspense><DemoCheckout /></Suspense>
    </div>
  );
}
