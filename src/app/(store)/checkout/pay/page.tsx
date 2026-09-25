import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { easebuzzConfigured } from "@/lib/payments";
import { PayCheckout } from "./PayCheckout";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function PayPage({ searchParams }: PageProps<"/checkout/pay">) {
  if (!easebuzzConfigured()) {
    const sp = await searchParams;
    redirect(`/checkout/demo?product=${typeof sp.product === "string" ? encodeURIComponent(sp.product) : ""}`);
  }
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 md:py-16">
      <Suspense><PayCheckout /></Suspense>
    </div>
  );
}
