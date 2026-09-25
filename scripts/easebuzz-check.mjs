// Checks your REAL Easebuzz credentials in ~2 seconds, with no money involved.
//   node scripts/easebuzz-check.mjs
// Reads EASEBUZZ_KEY / EASEBUZZ_SALT / EASEBUZZ_ENV from .env.local (or the shell) and calls Easebuzz's
// initiateLink (creates a payment session that is never paid) and Transaction API (asks about a fake txn).
import fs from "node:fs";
import { endpoints, requestHash, retrieveHash } from "../src/lib/easebuzz-core.ts";

const local = fs.existsSync(".env.local")
  ? Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]))
  : {};
const raw = (k) => process.env[k] ?? local[k] ?? "";
const key = raw("EASEBUZZ_KEY"), salt = raw("EASEBUZZ_SALT"), envName = raw("EASEBUZZ_ENV").trim().toLowerCase() === "prod" ? "prod" : "test";

const warn = [];
if (!key || !salt) { console.error("✗ EASEBUZZ_KEY and EASEBUZZ_SALT must both be set in .env.local"); process.exit(1); }
if (key !== key.trim() || salt !== salt.trim()) warn.push("key/salt has leading/trailing whitespace or a newline — a very common cause of 'Invalid hash'. (The app trims it, but fix the value in Vercel too.)");
if (/^["']|["']$/.test(key + salt)) warn.push("key/salt is wrapped in quotes — remove the quotes in Vercel's value box.");
const k = key.trim(), s = salt.trim();
console.log(`Environment: ${envName.toUpperCase()}  (${endpoints(envName).initiate})`);
console.log(`Key: ${k.slice(0, 3)}…${k.slice(-2)} (${k.length} chars)   Salt: ${s.length} chars\n`);
warn.forEach((w) => console.log("⚠", w));

const txnid = "BMCHECK" + Date.now().toString(36).toUpperCase();
const p = { key: k, txnid, amount: "1.00", productinfo: "Credential check", firstname: "Check", email: "check@example.com", phone: "9999999999", surl: "https://example.com/return", furl: "https://example.com/return", udf1: "check" };
const res = await fetch(endpoints(envName).initiate, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ ...p, hash: requestHash(p, s) }) });
const text = await res.text();
let j = null; try { j = JSON.parse(text); } catch { /* not json */ }

if (j && (j.status === 1 || j.status === "1" || j.status === true) && j.data) {
  console.log("✓ Initiate Payment accepted — your key, salt and hash are correct for this environment.");
  console.log(`  access key: ${String(j.data).slice(0, 8)}…  (session created, will never be paid)`);
} else {
  console.log("✗ Initiate Payment was REJECTED by Easebuzz:");
  console.log("  ", (j ? JSON.stringify(j) : text.slice(0, 300)));
  console.log("\nMost common causes:");
  console.log(" • Test key/salt used with EASEBUZZ_ENV=prod (or live key/salt with EASEBUZZ_ENV=test). Keys are per-environment.");
  console.log(" • Key and salt swapped, or copied with a space/newline/quotes.");
  console.log(" • The Easebuzz dashboard has not activated the environment or your IP/domain is restricted.");
  process.exitCode = 1;
}

const r2 = await fetch(endpoints(envName).retrieve, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ key: k, txnid: "BMNOSUCHTXN", hash: retrieveHash(k, "BMNOSUCHTXN", s) }) });
const t2 = (await r2.text()).slice(0, 200);
const bad = /invalid\s*hash|invalid\s*key|unauthor/i.test(t2);
console.log(bad ? `\n✗ Transaction API rejected the credentials: ${t2}` : `\n✓ Transaction API accepted the credentials (reply for a fake txn: ${t2})`);
if (bad) process.exitCode = 1;
