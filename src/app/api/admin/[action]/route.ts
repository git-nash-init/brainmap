import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueAppCredential } from "@/lib/fulfil";

/** Admin-only actions: app-credential | settings | template */
export async function POST(req: Request, ctx: RouteContext<"/api/admin/[action]">) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action } = await ctx.params;
  const admin = createAdminClient();

  try {
    if (action === "app-credential") {
      const { orderId } = await req.json();
      const { data: order } = await admin.from("orders").select("id, user_id").eq("id", orderId).maybeSingle();
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json(await issueAppCredential(order.id, order.user_id));
    }

    if (action === "settings") {
      const { appUrl } = await req.json();
      if (typeof appUrl !== "string" || !/^(https?:\/\/|\/)/.test(appUrl)) return NextResponse.json({ error: "Enter a full https:// URL" }, { status: 400 });
      const { error } = await admin.from("site_settings").upsert({ key: "app_url", value: appUrl.trim() });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "template") {
      const form = await req.formData();
      const file = form.get("file");
      const title = String(form.get("title") ?? "").trim();
      const category = String(form.get("category") ?? "Planner").trim();
      const productId = String(form.get("productId") ?? "");
      if (!(file instanceof File) || !title || !productId) return NextResponse.json({ error: "file, title and productId are required" }, { status: 400 });
      if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDF files" }, { status: 400 });
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const path = `${productId}/${slug}-${Date.now()}.pdf`;
      const { error: uErr } = await admin.storage.from("templates").upload(path, file, { contentType: "application/pdf" });
      if (uErr) throw uErr;
      const { error } = await admin.from("templates").insert({ product_id: productId, title, category, storage_path: path });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
