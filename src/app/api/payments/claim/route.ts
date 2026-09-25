import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { claimAccount, TXN_COOKIE } from "@/lib/payments";

/** After a purchase created a brand-new account, the buyer's own browser (cookie from checkout) sets the password once. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const store = await cookies();
  try {
    const r = await claimAccount(store.get(TXN_COOKIE)?.value, String(body?.password ?? ""));
    return NextResponse.json({ ok: true, email: r.email });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
