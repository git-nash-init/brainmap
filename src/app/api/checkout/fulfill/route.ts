import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { recordPurchase } from "@/lib/fulfil";
import { getAdmin } from "@/lib/auth";

/**
 * Creates an order (+ customer account + app login).
 *  - Called by a payment provider webhook with header `x-webhook-secret: $FULFILL_WEBHOOK_SECRET`
 *  - or by a signed-in admin (the Admin → Record purchase form).
 * Body: { email, productIds: string[], provider?, providerRef? }
 */
export async function POST(req: Request) {
  const secret = process.env.FULFILL_WEBHOOK_SECRET;
  const sent = req.headers.get("x-webhook-secret") ?? "";
  const viaSecret = !!secret && sent.length === secret.length && timingSafeEqual(Buffer.from(sent), Buffer.from(secret));
  if (!viaSecret && !(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== "string" || !Array.isArray(body.productIds)) {
    return NextResponse.json({ error: "email and productIds[] are required" }, { status: 400 });
  }
  try {
    const result = await recordPurchase({
      email: body.email,
      productIds: body.productIds.map(String),
      provider: body.provider ? String(body.provider) : undefined,
      providerRef: body.providerRef ? String(body.providerRef) : undefined,
    });
    // Credentials are only returned to an authenticated admin, never to a webhook caller.
    return NextResponse.json(viaSecret ? { orderId: result.orderId } : result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
