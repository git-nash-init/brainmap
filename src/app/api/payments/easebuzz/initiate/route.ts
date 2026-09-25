import { NextResponse } from "next/server";
import { CHECKOUT, type CheckoutKey } from "@/content/site";
import { easebuzzConfigured, initiatePayment, TXN_COOKIE } from "@/lib/payments";

export async function POST(req: Request) {
  if (!easebuzzConfigured()) return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  const body = await req.json().catch(() => null);
  const productId = body?.product as CheckoutKey | undefined;
  if (!productId || !(productId in CHECKOUT)) return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  try {
    const r = await initiatePayment({ productId, name: String(body.name ?? ""), email: String(body.email ?? ""), phone: String(body.phone ?? ""), origin: new URL(req.url).origin });
    const res = NextResponse.json({ url: r.url });
    res.cookies.set(TXN_COOKIE, r.cookie, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 6 * 3600 });
    return res;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
