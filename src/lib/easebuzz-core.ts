// Pure Easebuzz helpers (no server-only imports so they can be unit-tested with plain Node).
// Docs: https://docs.easebuzz.in  (Initiate Payment API, Transaction API v2.1)
import { createHash } from "node:crypto";

export type EasebuzzEnv = "test" | "prod" | "mock"; // "mock" = local test server (scripts/mock-easebuzz.mjs), never in production

export const sha512 = (s: string) => createHash("sha512").update(s, "utf8").digest("hex");

export const endpoints = (env: EasebuzzEnv) =>
  env === "mock"
    ? { initiate: "http://localhost:4010/payment/initiateLink", payPage: "http://localhost:4010/pay/", retrieve: "http://localhost:4010/transaction/v2.1/retrieve" }
    : env === "prod"
    ? { initiate: "https://pay.easebuzz.in/payment/initiateLink", payPage: "https://pay.easebuzz.in/pay/", retrieve: "https://dashboard.easebuzz.in/transaction/v2.1/retrieve" }
    : { initiate: "https://testpay.easebuzz.in/payment/initiateLink", payPage: "https://testpay.easebuzz.in/pay/", retrieve: "https://testdashboard.easebuzz.in/transaction/v2.1/retrieve" };

/** Easebuzz wants trimmed values and only [A-Za-z0-9 .,-] style text in productinfo/firstname to be safe. */
export const clean = (s: string, max = 100) => s.replace(/[^A-Za-z0-9 .,_-]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

export type InitiateParams = {
  key: string; txnid: string; amount: string; productinfo: string; firstname: string; email: string; phone: string;
  surl: string; furl: string; udf1?: string; udf2?: string; udf3?: string; udf4?: string; udf5?: string; udf6?: string; udf7?: string;
};

/** key|txnid|amount|productinfo|firstname|email|udf1..udf10|salt   (udf8–udf10 must stay empty) */
export function requestHash(p: InitiateParams, salt: string) {
  return sha512([p.key, p.txnid, p.amount, p.productinfo, p.firstname, p.email, p.udf1 ?? "", p.udf2 ?? "", p.udf3 ?? "", p.udf4 ?? "", p.udf5 ?? "", p.udf6 ?? "", p.udf7 ?? "", "", "", "", salt].join("|"));
}

/** Transaction API v2.1 hash: key|txnid|salt */
export const retrieveHash = (key: string, txnid: string, salt: string) => sha512(`${key}|${txnid}|${salt}`);

/**
 * Reverse hash for the surl/furl/webhook payload:
 *   [additional_charges|]salt|status|udf10..udf1|email|firstname|productinfo|amount|txnid|key
 * Used only as an extra integrity signal. Access is granted from the server-side Transaction API, never from this.
 */
export function responseHashMatches(f: Record<string, string>, salt: string) {
  const g = (k: string) => f[k] ?? "";
  const core = [salt, g("status"), g("udf10"), g("udf9"), g("udf8"), g("udf7"), g("udf6"), g("udf5"), g("udf4"), g("udf3"), g("udf2"), g("udf1"), g("email"), g("firstname"), g("productinfo"), g("amount"), g("txnid"), g("key")];
  const candidates = [core.join("|")];
  if (g("additional_charges")) candidates.unshift([g("additional_charges"), ...core].join("|"));
  const got = g("hash").toLowerCase();
  return !!got && candidates.some((c) => sha512(c) === got);
}

export type Verified = { found: boolean; success: boolean; status: string; amount: number | null; easepayid: string | null; raw: unknown };

/** Tolerant parser for the Transaction API response (object or array under `msg`/`data`). */
export function parseRetrieve(json: unknown, txnid: string): Verified {
  const j = json as { status?: unknown; msg?: unknown; data?: unknown } | null;
  const body = j?.msg ?? j?.data;
  const rows = (Array.isArray(body) ? body : body && typeof body === "object" ? [body] : []) as Record<string, unknown>[];
  const mine = rows.filter((r) => String(r.txnid ?? "") === txnid);
  if (!mine.length) return { found: false, success: false, status: "not_found", amount: null, easepayid: null, raw: json };
  const ok = mine.find((r) => String(r.status ?? "").toLowerCase() === "success");
  const r = ok ?? mine[mine.length - 1];
  const amt = Number(r.amount ?? r.net_amount_debit ?? NaN);
  return { found: true, success: !!ok, status: String(r.status ?? "unknown").toLowerCase(), amount: Number.isFinite(amt) ? amt : null, easepayid: r.easepayid ? String(r.easepayid) : null, raw: json };
}

export const FAILED_STATUSES = new Set(["failure", "failed", "usercancelled", "dropped", "bounced", "auto refunded"]);
