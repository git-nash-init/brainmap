import { redirect } from "next/navigation";
import { easebuzzConfigured } from "@/lib/payments";

/** Buy buttons land here: real Easebuzz checkout when keys are configured, otherwise the demo. */
export default async function CheckoutRouter({ searchParams }: PageProps<"/checkout">) {
  const sp = await searchParams;
  const product = typeof sp.product === "string" ? encodeURIComponent(sp.product) : "";
  redirect(`/checkout/${easebuzzConfigured() ? "pay" : "demo"}?product=${product}`);
}
