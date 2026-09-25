import { NextResponse } from "next/server";
import { easebuzzConfigured, completePayment } from "@/lib/payments";

/**
 * Server-to-server notification (set this URL in the Easebuzz dashboard → Webhooks).
 * It guarantees access is granted even if the customer closes the tab before returning to the site.
 * The payload is NOT trusted: we only read the txnid and re-verify with Easebuzz's Transaction API.
 */
export async function POST(req: Request) {
  if (!easebuzzConfigured()) return NextResponse.json({ ok: false }, { status: 503 });
  let txnid = "";
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const j = await req.json();
      txnid = String(j?.txnid ?? j?.data?.txnid ?? "");
    } else {
      const f = await req.formData();
      txnid = String(f.get("txnid") ?? "");
    }
  } catch { /* fall through */ }
  if (!/^[A-Za-z0-9]{6,40}$/.test(txnid)) return NextResponse.json({ ok: false, error: "no txnid" }, { status: 400 });
  const r = await completePayment(txnid);
  return NextResponse.json({ ok: true, state: r.state });
}
