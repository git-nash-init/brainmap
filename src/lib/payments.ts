import "server-only";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordPurchase } from "@/lib/fulfil";
import { clean, endpoints, FAILED_STATUSES, parseRetrieve, requestHash, retrieveHash, type EasebuzzEnv, type InitiateParams } from "@/lib/easebuzz-core";

export const TXN_COOKIE = "bm_txn";

export function easebuzzConfigured() {
  return !!(process.env.EASEBUZZ_KEY?.trim() && process.env.EASEBUZZ_SALT?.trim());
}
// .trim(): a stray space/newline pasted into Vercel silently changes the hash ("Invalid hash")
const cfg = () => ({
  key: process.env.EASEBUZZ_KEY!.trim(),
  salt: process.env.EASEBUZZ_SALT!.trim(),
  env: ((): EasebuzzEnv => { const e = process.env.EASEBUZZ_ENV?.trim().toLowerCase(); return e === "prod" ? "prod" : e === "mock" && process.env.NODE_ENV !== "production" ? "mock" : "test"; })(),
});
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export type InitiateInput = { productId: string; name: string; email: string; phone: string; origin: string };

/** Creates a pending payment row from OUR price list, asks Easebuzz for an access key, returns the hosted pay-page URL. */
export async function initiatePayment(i: InitiateInput) {
  const { key, salt, env } = cfg();
  const email = i.email.trim().toLowerCase();
  const phone = i.phone.replace(/[^\d+]/g, "");
  const name = clean(i.name, 60) || "Customer";
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
  if (!/^(\+\d{1,4}[-]?)?\d{8,15}$/.test(phone)) throw new Error("Enter a valid phone number.");

  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("id, name, price").eq("id", i.productId).maybeSingle();
  if (!product) throw new Error("Unknown product.");

  const txnid = `BM${randomBytes(9).toString("hex").toUpperCase()}`; // alphanumeric, unique
  const nonce = randomBytes(16).toString("hex");
  const { data: pay, error } = await admin
    .from("payments")
    .insert({ txnid, product_id: product.id, email, name, phone, amount: product.price, status: "initiated", session_hash: sha256(nonce) })
    .select("id")
    .single();
  if (error || !pay) throw new Error("Could not start the payment. Please try again.");

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || i.origin;
  const params: InitiateParams = {
    key, txnid, amount: product.price.toFixed(2), productinfo: clean(product.name) || "Brain Map", firstname: name, email, phone,
    surl: `${base}/api/payments/easebuzz/return`, furl: `${base}/api/payments/easebuzz/return`, udf1: pay.id,
  };
  const body = new URLSearchParams({ ...params, hash: requestHash(params, salt) } as Record<string, string>);
  const res = await fetch(endpoints(env).initiate, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  const json = (await res.json().catch(() => null)) as { status?: number | string | boolean; data?: string; error_desc?: string } | null;
  const ok = json && (json.status === 1 || json.status === "1" || json.status === true) && typeof json.data === "string" && json.data;
  if (!ok) {
    console.error("[easebuzz] initiate failed", res.status, JSON.stringify(json)?.slice(0, 300));
    await admin.from("payments").update({ status: "failed", gateway_status: "initiate_failed", raw: json as never }).eq("id", pay.id);
    throw new Error("The payment gateway rejected the request. Please try again in a moment.");
  }
  return { url: endpoints(env).payPage + json.data, txnid, cookie: `${txnid}.${nonce}` };
}

/** Server-to-server truth: ask Easebuzz what happened to this txnid. */
async function retrieve(txnid: string) {
  const { key, salt, env } = cfg();
  const body = new URLSearchParams({ key, txnid, hash: retrieveHash(key, txnid, salt) });
  const res = await fetch(endpoints(env).retrieve, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  const json = await res.json().catch(() => null);
  return parseRetrieve(json, txnid);
}

export type Outcome =
  | { state: "paid"; orderId: string; newAccount: boolean }
  | { state: "failed"; reason: string }
  | { state: "pending" }
  | { state: "unknown" };

/**
 * Idempotent. Called from the browser return, the webhook and the success page — whichever comes first wins,
 * the rest just read the result. Access is granted ONLY when Easebuzz itself reports `success` for this txnid
 * AND the amount equals our stored price.
 */
export async function completePayment(txnid: string): Promise<Outcome> {
  const admin = createAdminClient();
  const { data: p } = await admin.from("payments").select("*").eq("txnid", txnid).maybeSingle();
  if (!p) return { state: "unknown" };
  if (p.status === "paid" && p.order_id) return { state: "paid", orderId: p.order_id, newAccount: p.new_account && !p.claimed_at };

  let v;
  try { v = await retrieve(txnid); } catch (e) { console.error("[easebuzz] retrieve error", e); return { state: "pending" }; }

  if (v.success) {
    if (v.amount === null || Math.round(v.amount * 100) !== p.amount * 100) {
      console.error("[easebuzz] AMOUNT MISMATCH", txnid, v.amount, p.amount);
      await admin.from("payments").update({ status: "failed", gateway_status: "amount_mismatch", raw: v.raw as never }).eq("id", p.id);
      return { state: "failed", reason: "The paid amount did not match the order. Contact support with your transaction id: " + txnid };
    }
    // single winner does the fulfilment
    const { data: won } = await admin.from("payments").update({ status: "fulfilling" }).eq("id", p.id).in("status", ["initiated", "failed"]).select("id").maybeSingle();
    if (!won) {
      const { data: again } = await admin.from("payments").select("status, order_id, new_account, claimed_at").eq("id", p.id).single();
      if (again?.status === "paid" && again.order_id) return { state: "paid", orderId: again.order_id, newAccount: again.new_account && !again.claimed_at };
      return { state: "pending" };
    }
    try {
      const r = await recordPurchase({ email: p.email, productIds: [p.product_id], provider: "easebuzz", providerRef: txnid });
      await admin.from("payments").update({ status: "paid", order_id: r.orderId, new_account: r.newAccount, easepay_id: v.easepayid, gateway_status: v.status, raw: v.raw as never, paid_at: new Date().toISOString() }).eq("id", p.id);
      return { state: "paid", orderId: r.orderId, newAccount: r.newAccount };
    } catch (e) {
      console.error("[easebuzz] fulfilment failed", txnid, e);
      await admin.from("payments").update({ status: "initiated" }).eq("id", p.id); // allow retry (webhook / reload)
      return { state: "pending" };
    }
  }

  if (v.found && FAILED_STATUSES.has(v.status)) {
    await admin.from("payments").update({ status: "failed", gateway_status: v.status, raw: v.raw as never }).eq("id", p.id).neq("status", "paid");
    return { state: "failed", reason: v.status === "usercancelled" ? "You cancelled the payment." : "The payment was not completed." };
  }
  return { state: "pending" };
}

/** Lets the browser that started checkout set its password once, after a brand-new account was created by the purchase. */
export async function claimAccount(cookieValue: string | undefined, password: string) {
  if (!cookieValue || password.length < 8) throw new Error("Choose a password with at least 8 characters.");
  const [txnid, nonce] = cookieValue.split(".");
  if (!txnid || !nonce) throw new Error("This link has expired.");
  const admin = createAdminClient();
  const { data: p } = await admin.from("payments").select("id, status, order_id, session_hash, new_account, claimed_at, paid_at").eq("txnid", txnid).maybeSingle();
  const a = Buffer.from(sha256(nonce)), b = Buffer.from(p?.session_hash ?? "");
  if (!p || p.status !== "paid" || !p.order_id || !p.new_account || p.claimed_at || a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("This link has expired. Use “Forgot password” on the sign-in page.");
  if (Date.now() - new Date(p.paid_at!).getTime() > 6 * 3600 * 1000) throw new Error("This link has expired. Use “Forgot password” on the sign-in page.");
  const { data: o } = await admin.from("orders").select("user_id, email").eq("id", p.order_id).single();
  if (!o) throw new Error("Order not found.");
  const { error } = await admin.auth.admin.updateUserById(o.user_id, { password });
  if (error) throw new Error(error.message);
  await admin.from("payments").update({ claimed_at: new Date().toISOString() }).eq("id", p.id);
  return { email: o.email };
}

/** True when this browser started the checkout that created a new account whose password hasn't been set yet. */
export async function needsClaim(cookieValue: string | undefined, orderId: string) {
  if (!cookieValue) return false;
  const [txnid, nonce] = cookieValue.split(".");
  if (!txnid || !nonce) return false;
  const { data: p } = await createAdminClient().from("payments").select("order_id, session_hash, new_account, claimed_at, status").eq("txnid", txnid).maybeSingle();
  return !!p && p.status === "paid" && p.order_id === orderId && p.new_account && !p.claimed_at && p.session_hash === sha256(nonce);
}
