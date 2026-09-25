import { NextResponse } from "next/server";
import { easebuzzConfigured, completePayment } from "@/lib/payments";
import { responseHashMatches } from "@/lib/easebuzz-core";

/**
 * Easebuzz sends the customer's browser here (surl/furl) as a POST form.
 * We use ONLY the txnid from it, then ask Easebuzz directly what happened (completePayment).
 */
async function handle(req: Request, fields: Record<string, string>) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  const go = (path: string) => NextResponse.redirect(new URL(path, origin), 303);
  const txnid = (fields.txnid ?? "").trim();
  if (!easebuzzConfigured() || !/^[A-Za-z0-9]{6,40}$/.test(txnid)) return go("/checkout/failed?reason=invalid");

  if (fields.hash && !responseHashMatches(fields, process.env.EASEBUZZ_SALT!.trim())) console.warn("[easebuzz] return payload hash did not match (verified via Transaction API instead)", txnid);

  const r = await completePayment(txnid);
  if (r.state === "paid") return go(`/checkout/success?order=${r.orderId}&txn=${txnid}`);
  if (r.state === "pending") return go(`/checkout/success?txn=${txnid}`); // success page keeps re-checking
  if (r.state === "failed") return go(`/checkout/failed?txn=${txnid}&reason=${encodeURIComponent(r.reason)}`);
  return go("/checkout/failed?reason=unknown");
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const fields: Record<string, string> = {};
  form?.forEach((v, k) => { if (typeof v === "string") fields[k] = v; });
  return handle(req, fields);
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  return handle(req, Object.fromEntries(u.searchParams));
}
