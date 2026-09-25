import { NextResponse } from "next/server";
import { CHECKOUT, type CheckoutKey } from "@/content/site";
import { recordPurchase } from "@/lib/fulfil";
import { easebuzzConfigured } from "@/lib/payments";

/**
 * DEMO payment: no money moves. Creates a real (test) order + account + app login so the whole
 * customer flow can be tried. It is only available while that product's CHECKOUT link in
 * src/content/site.ts is still "#" — once you add a real payment link this returns 403.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const key = body?.product as CheckoutKey | undefined;
  if (!key || !(key in CHECKOUT)) return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  if (easebuzzConfigured()) return NextResponse.json({ error: "Demo checkout is disabled" }, { status: 403 });
  if (CHECKOUT[key] !== "#") return NextResponse.json({ error: "Demo checkout is disabled" }, { status: 403 });
  if (typeof body.email !== "string" || !/^\S+@\S+\.\S+$/.test(body.email)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });

  // Without the service-role key we can't create accounts: still let the UI show the success screen.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ preview: true });

  try {
    const r = await recordPurchase({
      email: body.email,
      productIds: [key],
      provider: "demo",
      password: typeof body.password === "string" && body.password.length >= 8 ? body.password : undefined,
    });
    return NextResponse.json({ orderId: r.orderId, newAccount: r.newAccount });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
