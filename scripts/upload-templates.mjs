// Uploads templates-out/*.pdf to the private "templates" bucket and registers them in public.templates.
//   node scripts/upload-templates.mjs           (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
// Safe to re-run: existing titles are skipped.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
if (!env.SUPABASE_SERVICE_ROLE_KEY) { console.error("Set SUPABASE_SERVICE_ROLE_KEY in .env.local first."); process.exit(1); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const manifest = JSON.parse(fs.readFileSync("templates-out/manifest.json", "utf8"));
const { data: existing } = await sb.from("templates").select("title");
const have = new Set((existing ?? []).map((t) => t.title));

let sort = 0;
for (const t of manifest) {
  sort += 10;
  if (have.has(t.title)) { console.log("skip", t.title); continue; }
  const storagePath = `${t.productId}/${t.file}`;
  const { error: uErr } = await sb.storage.from("templates").upload(storagePath, fs.readFileSync(path.join("templates-out", t.file)), { contentType: "application/pdf", upsert: true });
  if (uErr) { console.error("upload failed", t.title, uErr.message); continue; }
  const { error } = await sb.from("templates").insert({ product_id: t.productId, title: t.title, category: t.category, storage_path: storagePath, sort });
  console.log(error ? `✗ ${t.title}: ${error.message}` : `✓ ${t.title}`);
}
