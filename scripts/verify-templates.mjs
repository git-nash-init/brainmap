// Checks that every template row points at a real file (signed URL -> HTTP 200 + PDF), and re-uploads any that are missing.
//   node scripts/verify-templates.mjs            (needs SUPABASE_SERVICE_ROLE_KEY in .env.local and templates-out/ built)
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: rows, error } = await sb.from("templates").select("title, storage_path, product_id").order("sort");
if (error) throw error;

async function check(r) {
  const { data } = await sb.storage.from("templates").createSignedUrl(r.storage_path, 60);
  if (!data) return false;
  const res = await fetch(data.signedUrl);
  const type = res.headers.get("content-type") ?? "";
  await res.arrayBuffer();
  return res.status === 200 && type.includes("pdf");
}

let bad = 0;
for (const r of rows) {
  if (await check(r)) { console.log("✓", r.title); continue; }
  const file = path.join("templates-out", path.basename(r.storage_path));
  if (!fs.existsSync(file)) { console.log("✗ MISSING and no local file to upload:", r.title, file); bad++; continue; }
  const { error: uErr } = await sb.storage.from("templates").upload(r.storage_path, fs.readFileSync(file), { contentType: "application/pdf", upsert: true });
  const fixed = !uErr && (await check(r));
  console.log(fixed ? "↻ re-uploaded and verified:" : "✗ still failing:", r.title, uErr?.message ?? "");
  if (!fixed) bad++;
}
console.log(bad ? `\n${bad} template(s) still broken` : `\nAll ${rows.length} templates download correctly`);
process.exitCode = bad ? 1 : 0;
