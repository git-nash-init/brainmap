// Local stand-in for Easebuzz's servers, for testing our integration end-to-end without real money.
// It verifies request hashes with its OWN copy of the documented formula (independent of src/lib/easebuzz-core.ts),
// so a wrong sequence on our side is rejected exactly like the real gateway would ("Invalid hash").
//   MOCK_KEY=TESTKEY MOCK_SALT=TESTSALT node scripts/mock-easebuzz.mjs        (listens on :4010)
import http from "node:http";
import { createHash } from "node:crypto";

const KEY = process.env.MOCK_KEY ?? "TESTKEY";
const SALT = process.env.MOCK_SALT ?? "TESTSALT";
const sha = (s) => createHash("sha512").update(s).digest("hex");
const txns = new Map(); // txnid -> { params, outcome: {status, amount} | null }

const readBody = (req) => new Promise((res) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => res(b)); });
const json = (res, code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const raw = await readBody(req);
  const f = Object.fromEntries(new URLSearchParams(raw));

  if (req.method === "POST" && url.pathname === "/payment/initiateLink") {
    const u = (n) => f[`udf${n}`] ?? "";
    const seq = [f.key, f.txnid, f.amount, f.productinfo, f.firstname, f.email, u(1), u(2), u(3), u(4), u(5), u(6), u(7), u(8), u(9), u(10), SALT].join("|");
    const problems = [];
    if (f.key !== KEY) problems.push("Invalid key");
    if (sha(seq) !== f.hash) problems.push("Invalid hash");
    if (!/^[0-9.]+$/.test(f.amount ?? "")) problems.push("Invalid amount");
    if (!f.surl || !f.furl) problems.push("surl/furl missing");
    if (!/^(\+\d{1,4}[-]?)?\d{5,20}$/.test(f.phone ?? "")) problems.push("Invalid phone");
    if (problems.length) return json(res, 200, { status: 0, error_desc: problems.join("; "), data: null });
    txns.set(f.txnid, { params: f, outcome: null });
    return json(res, 200, { status: 1, data: `AK_${f.txnid}` });
  }
  if (req.method === "GET" && url.pathname.startsWith("/pay/")) return json(res, 200, { ok: true, page: "hosted payment page (mock)" });

  if (req.method === "POST" && url.pathname === "/transaction/v2.1/retrieve") {
    if (f.key !== KEY || sha(`${f.key}|${f.txnid}|${SALT}`) !== f.hash) return json(res, 200, { status: false, msg: "Invalid hash" });
    const t = txns.get(f.txnid);
    if (!t?.outcome) return json(res, 200, { status: false, msg: "Transaction not found" });
    return json(res, 200, { status: true, msg: { txnid: f.txnid, status: t.outcome.status, amount: t.outcome.amount, easepayid: "E" + f.txnid.slice(2, 12), email: t.params.email } });
  }

  // test controls
  if (url.pathname === "/_control" && req.method === "POST") { const t = txns.get(f.txnid ?? JSON.parse(raw || "{}").txnid); const b = JSON.parse(raw); if (!t) return json(res, 404, { error: "unknown txn" }); t.outcome = b.status ? { status: b.status, amount: b.amount } : null; return json(res, 200, { ok: true }); }
  if (url.pathname === "/_txns") return json(res, 200, [...txns.entries()].map(([id, t]) => ({ txnid: id, amount: t.params.amount, email: t.params.email, udf1: t.params.udf1 })));
  json(res, 404, { error: "not found" });
}).listen(4010, () => console.log("mock Easebuzz on http://localhost:4010"));
