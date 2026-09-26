import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CopyField } from "@/components/account/CopyField";
import { TemplateBrowser } from "@/components/account/TemplateBrowser";
import { ButtonLink } from "@/components/ui/Button";
import { productsOf } from "@/lib/rel";

export const metadata: Metadata = { title: "Purchase" };

export default async function PurchasePage({ params }: PageProps<"/account/purchases/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: order } = await supabase
    .from("orders")
    .select("id, total, created_at, order_items(product_id, products(id, name, kind))")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const bought = productsOf(order.order_items);
  const ids = bought.map((p) => p.id);
  const { data: bundled } = await supabase.from("bundle_items").select("product_id").in("bundle_id", ids);
  const effective = [...new Set([...ids, ...(bundled ?? []).map((b) => b.product_id)])];

  const [{ data: templates }, { data: creds }, { data: setting }] = await Promise.all([
    supabase.from("templates").select("id, title, category, product_id, storage_path, sort").in("product_id", effective).order("sort"),
    supabase.from("app_credentials").select("id, username, temp_password, password_changed, issued_at").eq("order_id", id),
    supabase.from("site_settings").select("value").eq("key", "app_url").maybeSingle(),
  ]);
  const appUrl = setting?.value ?? "/app";
  const hasApp = effective.includes("second-brain");

  return (
    <Container className="max-w-4xl py-12 md:py-16">
      <Link href="/account" className="link-grow text-sm font-semibold">← All purchases</Link>
      <Reveal>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-4xl">{bought.map((p) => p.name).join(" + ")}</h1>
        <p className="mt-1 text-sm text-ink/60">Order {order.id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      </Reveal>

      {hasApp && (
        <Reveal className="mt-10 overflow-hidden rounded-3xl bg-ink text-white">
          <div className="grid gap-8 p-6 md:grid-cols-[1fr_1.1fr] md:p-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime">Brain Map OS</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold">Your app login</h2>
              <p className="mt-2 text-sm text-white/70">Open the app, sign in with these details and choose your own password. Your data is encrypted on your device — keep the recovery code the app shows you.</p>
              <div className="mt-5"><ButtonLink href={appUrl} variant="lime" size="lg" target="_blank" rel="noopener">Open the app</ButtonLink></div>
              <p className="mt-4 text-xs text-white/50">Tip: on your phone choose “Add to Home Screen” to install it.</p>
            </div>
            <div className="space-y-4 text-ink">
              {creds?.length ? creds.map((c) => (
                <div key={c.id} className="space-y-3 rounded-2xl bg-mist p-4">
                  <CopyField label="App link" value={appUrl.startsWith("http") ? appUrl : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${appUrl}`} />
                  <CopyField label="Username" value={c.username} />
                  {c.password_changed ? (
                    <p className="rounded-lg bg-lime/60 px-3 py-2 text-sm">✓ You’ve set your own password. You can change it any time in the app under Settings → Security. If you forget it, contact support and use your recovery code.</p>
                  ) : (
                    <CopyField label="Temporary password" value={c.temp_password ?? ""} secret />
                  )}
                </div>
              )) : <p className="rounded-2xl bg-mist p-4 text-sm">Your login is being prepared. Refresh in a minute or contact support.</p>}
            </div>
          </div>
        </Reveal>
      )}

      {(templates?.length ?? 0) > 0 && (
        <section className="mt-12">
          <Reveal><h2 className="font-display text-2xl font-extrabold">Your templates</h2><p className="mt-1 text-sm text-ink/60">Download the PDF, or open it in your browser to type into the fillable fields.</p></Reveal>
          <TemplateBrowser templates={templates!} />
        </section>
      )}
      {!hasApp && (templates?.length ?? 0) === 0 && <p className="mt-10 rounded-2xl border border-dashed border-ink/30 p-8 text-center text-sm text-ink/60">Your files are being added. Please check back shortly or contact support.</p>}
    </Container>
  );
}
