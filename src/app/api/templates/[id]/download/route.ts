import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Entitlement-checked download: RLS on `templates` only returns rows the caller has bought. */
export async function GET(req: Request, ctx: RouteContext<"/api/templates/[id]/download">) {
  const { id } = await ctx.params;
  const inline = new URL(req.url).searchParams.get("inline") === "1"; // "Edit" opens the fillable PDF in the browser
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { data: tpl } = await supabase.from("templates").select("title, storage_path").eq("id", id).maybeSingle();
  if (!tpl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("templates").createSignedUrl(tpl.storage_path, 60, inline ? undefined : { download: `${tpl.title}.pdf` });
  if (error || !data) return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
