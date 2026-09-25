// End-to-end test of the Easebuzz integration against the mock gateway + the real Supabase project.
//   1) node scripts/mock-easebuzz.mjs
//   2) EASEBUZZ_KEY=TESTKEY EASEBUZZ_SALT=TESTSALT EASEBUZZ_ENV=mock npx next dev -p 3300
//   3) node scripts/e2e-easebuzz.mjs        (creates and then deletes its own test user)
import assert from "node:assert/strict";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const SITE = "http://localhost:3300", MOCK = "http://localhost:4010";
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const email = `e2e-${Date.now()}@example.com`;
let n = 0;
const ok = (m) => { n++; console.log("✓", m); };
const control = (txnid, status, amount) => fetch(`${MOCK}/_control`, { method: "POST", body: JSON.stringify({ txnid, status, amount }) });
const latestTxn = async () => (await (await fetch(`${MOCK}/_txns`)).json()).at(-1);
const initiate = async (product = "habit-full") => {
  const r = await fetch(`${SITE}/api/payments/easebuzz/initiate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product, name: "E2E Buyer", email, phone: "9876543210" }) });
  const j = await r.json();
  return { status: r.status, json: j, cookie: (r.headers.get("set-cookie") ?? "").split(";")[0] };
};
const ret = (txnid, extra = {}) => fetch(`${SITE}/api/payments/easebuzz/return`, { method: "POST", redirect: "manual", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ txnid, status: "success", ...extra }) });
const count = async (table, col, val) => (await admin.from(table).select("*", { count: "exact", head: true }).eq(col, val)).count;

try {
  // 1. price comes from the server, and the gateway accepts our hash
  const a = await initiate();
  assert.equal(a.status, 200, JSON.stringify(a.json));
  assert.match(a.json.url, /^http:\/\/localhost:4010\/pay\/AK_BM/);
  const t1 = await latestTxn();
  assert.equal(t1.amount, "399.00");
  ok("initiate: gateway accepted the hash; amount = server price 399.00; pay URL returned");

  // 2. a forged/unknown price cannot be injected by the client
  const r0 = await fetch(`${SITE}/api/payments/easebuzz/initiate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product: "habit-full", amount: 1, name: "X", email, phone: "9876543210" }) });
  await r0.json();
  assert.equal((await latestTxn()).amount, "399.00");
  ok("client-supplied amount is ignored");

  // 3. browser returns but the bank has NOT confirmed yet -> no access
  let r = await ret(t1.txnid);
  assert.equal(r.status, 303);
  assert.match(r.headers.get("location"), /\/checkout\/success\?txn=/);
  assert.equal(await count("orders", "email", email), 0);
  ok("return before confirmation: sent to 'confirming' page, NO order created");

  // 4. attacker POSTs status=success but Easebuzz says cancelled -> denied
  await control(t1.txnid, "userCancelled", "399.0");
  r = await ret(t1.txnid, { status: "success" });
  assert.match(r.headers.get("location"), /\/checkout\/failed/);
  assert.equal(await count("orders", "email", email), 0);
  ok("forged status=success while gateway says cancelled: DENIED");

  // 5. paid amount lower than price -> denied
  const b = await initiate(); const t2 = await latestTxn();
  await control(t2.txnid, "success", "1.0");
  r = await ret(t2.txnid);
  assert.match(r.headers.get("location"), /\/checkout\/failed/);
  assert.equal(await count("orders", "email", email), 0);
  ok("amount mismatch (paid 1.0 vs 399): DENIED, no access");

  // 6. real success -> order + access
  const c = await initiate(); const t3 = await latestTxn();
  await control(t3.txnid, "success", "399.0");
  r = await ret(t3.txnid);
  assert.equal(r.status, 303);
  const loc = r.headers.get("location");
  const orderId = /order=([0-9a-f-]{36})/.exec(loc)?.[1];
  assert.ok(orderId, loc);
  assert.equal(await count("orders", "email", email), 1);
  const { data: pay } = await admin.from("payments").select("status, order_id, new_account, easepay_id").eq("txnid", t3.txnid).single();
  assert.deepEqual([pay.status, pay.order_id, pay.new_account], ["paid", orderId, true]);
  ok("verified success: order created, payment row = paid, new account flagged");

  // 7. webhook + repeated return are idempotent (no duplicate orders)
  const w = await fetch(`${SITE}/api/payments/easebuzz/webhook`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ txnid: t3.txnid }) });
  assert.equal((await w.json()).state, "paid");
  await ret(t3.txnid); await ret(t3.txnid);
  assert.equal(await count("orders", "email", email), 1);
  ok("webhook + repeated returns: still exactly 1 order (idempotent)");

  // 8. webhook alone grants access even if the buyer never comes back
  const d = await initiate(); const t4 = await latestTxn();
  await control(t4.txnid, "success", "399.0");
  const w2 = await fetch(`${SITE}/api/payments/easebuzz/webhook`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ txnid: t4.txnid, status: "success" }) });
  assert.equal((await w2.json()).state, "paid");
  ok("webhook only (buyer closed the tab): access granted");

  // 9. buyer's browser sets a password; can then sign in and owns the entitlement
  const claim = await fetch(`${SITE}/api/payments/claim`, { method: "POST", headers: { "content-type": "application/json", cookie: c.cookie }, body: JSON.stringify({ password: "E2E-Pass-12345" }) });
  const cj = await claim.json();
  assert.equal(claim.status, 200, JSON.stringify(cj));
  const again = await fetch(`${SITE}/api/payments/claim`, { method: "POST", headers: { "content-type": "application/json", cookie: c.cookie }, body: JSON.stringify({ password: "Other-Pass-999" }) });
  assert.equal(again.status, 400);
  const other = await fetch(`${SITE}/api/payments/claim`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: "Hacker-Pass-999" }) });
  assert.equal(other.status, 400);
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { error: sErr } = await anon.auth.signInWithPassword({ email, password: "E2E-Pass-12345" });
  assert.equal(sErr, null);
  const { data: own } = await anon.from("orders").select("id");
  assert.equal(own.length, 2); // the step-6 order and the step-8 order
  ok("password set once by the paying browser (2nd try + cookie-less request rejected); sign-in works; buyer sees both of their orders");

  // 10. bad input is refused before reaching the gateway
  const bad = await fetch(`${SITE}/api/payments/easebuzz/initiate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product: "nope", name: "X", email, phone: "1" }) });
  assert.equal(bad.status, 400);
  ok("unknown product rejected");

  console.log(`\nALL ${n} END-TO-END CHECKS PASSED`);
} catch (e) {
  console.error("\n✗ FAILED:", e.message ?? e);
  process.exitCode = 1;
} finally {
  const { data: pays } = await admin.from("payments").select("id").eq("email", email);
  await admin.from("payments").delete().eq("email", email);
  const { data: id } = await admin.rpc("find_user_id_by_email", { p_email: email });
  if (id) await admin.auth.admin.deleteUser(id);
  console.log(`(cleaned up ${pays?.length ?? 0} payments and the test user)`);
}
