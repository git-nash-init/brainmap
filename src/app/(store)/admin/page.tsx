import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser, isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Container } from "@/components/ui/Section";
import { AdminPanel } from "./AdminPanel";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminPage() {
  const { user } = await requireUser();
  if (!isAdmin(user)) notFound();

  const admin = createAdminClient();
  const [{ data: orders }, { data: templates }, { data: products }, { data: setting }] = await Promise.all([
    admin.from("orders").select("id, email, total, status, provider, created_at, app_credentials(username, password_changed)").order("created_at", { ascending: false }).limit(50),
    admin.from("templates").select("id, title, category, product_id").order("created_at", { ascending: false }),
    admin.from("products").select("id, name").order("id"),
    admin.from("site_settings").select("value").eq("key", "app_url").maybeSingle(),
  ]);

  return (
    <Container className="max-w-5xl py-12">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Admin</h1>
      <p className="mt-1 text-sm text-ink/60">Record purchases, issue app logins, upload templates and set the live app URL.</p>
      <AdminPanel orders={orders ?? []} templates={templates ?? []} products={products ?? []} appUrl={setting?.value ?? "/app"} />
    </Container>
  );
}
