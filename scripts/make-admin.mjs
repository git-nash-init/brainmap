// Creates (or promotes) the store owner account.
//   node scripts/make-admin.mjs you@example.com "a-strong-password"
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local. Then sign in at /account/login and open /admin.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);
if (!email || !password) { console.error('Usage: node scripts/make-admin.mjs <email> "<password>"'); process.exit(1); }
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
if (!env.SUPABASE_SERVICE_ROLE_KEY) { console.error("Set SUPABASE_SERVICE_ROLE_KEY in .env.local first."); process.exit(1); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: id } = await sb.rpc("find_user_id_by_email", { p_email: email });
if (id) {
  const { error } = await sb.auth.admin.updateUserById(id, { password, app_metadata: { role: "admin" } });
  console.log(error ? `✗ ${error.message}` : `✓ ${email} is now an admin (password updated)`);
} else {
  const { error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { role: "admin" } });
  console.log(error ? `✗ ${error.message}` : `✓ created admin ${email}`);
}
