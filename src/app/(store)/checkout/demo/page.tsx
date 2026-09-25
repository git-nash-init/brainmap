import type { Metadata } from "next";
import { Suspense } from "react";
import { DemoCheckout } from "./DemoCheckout";

export const metadata: Metadata = { title: "Checkout (demo)", robots: { index: false } };

export default function DemoCheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 md:py-16">
      <Suspense><DemoCheckout /></Suspense>
    </div>
  );
}
