// Offline tests for the Easebuzz hash + verification logic.   node scripts/test-easebuzz.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { requestHash, retrieveHash, responseHashMatches, parseRetrieve, clean, sha512, endpoints } from "../src/lib/easebuzz-core.ts";

const sha = (s) => createHash("sha512").update(s).digest("hex");
let n = 0;
const t = (name, fn) => { fn(); n++; console.log("✓", name); };

const salt = "TESTSALT";
const p = { key: "TESTKEY", txnid: "BMABC123DEF456", amount: "399.00", productinfo: "Brain Map Full Planning System", firstname: "Aarav", email: "aarav@example.com", phone: "9876543210", surl: "https://x/return", furl: "https://x/return", udf1: "uuid-1" };

t("request hash = key|txnid|amount|productinfo|firstname|email|udf1..udf10|salt (17 fields, 16 pipes)", () => {
  const expected = "TESTKEY|BMABC123DEF456|399.00|Brain Map Full Planning System|Aarav|aarav@example.com|uuid-1||||||||||TESTSALT";
  assert.equal(expected.split("|").length, 17);
  assert.equal(requestHash(p, salt), sha(expected));
});
t("udf8–udf10 always empty even if extra udfs exist", () => {
  const h = requestHash({ ...p, udf2: "a", udf7: "g" }, salt);
  const fields = ["TESTKEY", "BMABC123DEF456", "399.00", "Brain Map Full Planning System", "Aarav", "aarav@example.com", "uuid-1", "a", "", "", "", "", "g", "", "", "", "TESTSALT"];
  assert.equal(fields.length, 17);
  assert.equal(h, sha(fields.join("|")));
});
t("hash changes if amount formatting differs (399 vs 399.00) → we always send the SAME string we hash", () => {
  assert.notEqual(requestHash({ ...p, amount: "399" }, salt), requestHash(p, salt));
});
t("retrieve hash = key|txnid|salt", () => assert.equal(retrieveHash("K", "T", "S"), sha("K|T|S")));
t("clean() strips characters that break hashes/gateway validation", () => {
  assert.equal(clean("Brain Map — Full Planning & System!"), "Brain Map Full Planning System");
  assert.equal(clean("  Aarav  "), "Aarav");
});

// response hash (reverse sequence)
const resp = { key: "TESTKEY", txnid: "BMABC123DEF456", amount: "399.0", productinfo: "Brain Map Full Planning System", firstname: "Aarav", email: "aarav@example.com", status: "success", udf1: "uuid-1" };
const rev = (extra = "") => sha([...(extra ? [extra] : []), salt, "success", "", "", "", "", "", "", "", "", "", "uuid-1", "aarav@example.com", "Aarav", "Brain Map Full Planning System", "399.0", "BMABC123DEF456", "TESTKEY"].join("|"));
t("response reverse hash verifies", () => assert.ok(responseHashMatches({ ...resp, hash: rev() }, salt)));
t("response reverse hash with additional_charges verifies", () => assert.ok(responseHashMatches({ ...resp, additional_charges: "5.0", hash: rev("5.0") }, salt)));
t("tampered amount or wrong salt is rejected", () => {
  assert.ok(!responseHashMatches({ ...resp, amount: "1.0", hash: rev() }, salt));
  assert.ok(!responseHashMatches({ ...resp, hash: rev() }, "WRONG"));
  assert.ok(!responseHashMatches({ ...resp }, salt)); // missing hash
});

// Transaction API parsing
t("retrieve: success row (object under msg)", () => {
  const v = parseRetrieve({ status: true, msg: { txnid: "T1", status: "success", amount: "399.0", easepayid: "E1" } }, "T1");
  assert.deepEqual([v.found, v.success, v.amount, v.easepayid], [true, true, 399, "E1"]);
});
t("retrieve: several attempts, one success (array) → success", () => {
  const v = parseRetrieve({ status: true, msg: [{ txnid: "T1", status: "failure", amount: "399.0" }, { txnid: "T1", status: "success", amount: "399.0", easepayid: "E2" }] }, "T1");
  assert.ok(v.success && v.easepayid === "E2");
});
t("retrieve: rows for a DIFFERENT txnid never count", () => {
  const v = parseRetrieve({ status: true, msg: [{ txnid: "OTHER", status: "success", amount: "399.0" }] }, "T1");
  assert.ok(!v.found && !v.success);
});
t("retrieve: failure / userCancelled / empty are not success", () => {
  assert.ok(!parseRetrieve({ status: true, msg: { txnid: "T1", status: "userCancelled", amount: "399" } }, "T1").success);
  assert.ok(!parseRetrieve({ status: false, msg: "Transaction not found" }, "T1").found);
  assert.ok(!parseRetrieve(null, "T1").found);
});
t("endpoints per environment", () => {
  assert.match(endpoints("test").initiate, /^https:\/\/testpay\.easebuzz\.in\//);
  assert.match(endpoints("prod").initiate, /^https:\/\/pay\.easebuzz\.in\//);
  assert.match(endpoints("prod").retrieve, /^https:\/\/dashboard\.easebuzz\.in\//);
});
t("sha512 is 128 hex chars, lowercase", () => assert.match(sha512("x"), /^[0-9a-f]{128}$/));

console.log(`\n${n} tests passed`);
