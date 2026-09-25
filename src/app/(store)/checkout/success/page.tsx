import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Container } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { SuccessBurst } from "@/components/account/SuccessBurst";
import { catalog, inr } from "@/content/products";
import { productsOf } from "@/lib/rel";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Landing page after payment: `?order=<order uuid>` (the id is unguessable; only names and totals are shown). */
export default async function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const sp = await searchParams;
  const orderId = typeof sp.order === "string" && uuid.test(sp.order) ? sp.order : null;

  let items: { id: string; name: string; kind: string }[] = [];
  let total = 0;
  let masked = "";
  if (orderId) {
    const admin = createAdminClient();
    const { data } = await admin.from("orders").select("email, total, order_items(products(id, name, kind))").eq("id", orderId).maybeSingle();
    if (data) {
      total = data.total;
      masked = data.email.replace(/^(.).*(@.*)$/, "$1•••$2");
      items = productsOf(data.order_items);
    }
  }
  // preview fallback (demo checkout without the service-role key): show the product from the catalog
  const demoKey = typeof sp.demo === "string" ? sp.demo : null;
  if (!orderId && demoKey) {
    const hit = catalog.flatMap((p) => p.variants.map((v) => ({ p, v }))).find((x) => x.v.id === demoKey);
    if (hit) { items = [{ id: hit.v.id, name: hit.p.name, kind: hit.p.kind }]; total = hit.v.price; }
  }
  const hasApp = items.some((i) => i.kind === "app" || i.kind === "bundle");

  return (
    <Container className="max-w-2xl py-16 text-center md:py-24">
      <SuccessBurst />
      <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight md:text-5xl">Payment successful!</h1>
      <p className="mt-3 text-ink/70">Thank you for choosing Brain Map. Your purchase is ready in your account{masked ? <> (<b>{masked}</b>)</> : null}.</p>

      {items.length > 0 && (
        <div className="mt-8 rounded-2xl border border-line bg-white p-5 text-left shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/55">You purchased</p>
          <ul className="mt-3 divide-y divide-line">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-xs text-white">✓</span>
                <span className="font-semibold">{i.name}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-line pt-3 text-right text-sm">Total <b>{inr(total)}</b></p>
        </div>
      )}

      <ol className="mx-auto mt-8 max-w-md space-y-2 text-left text-sm text-ink/75">
        <li>1. Sign in with the email you used at checkout.</li>
        <li>2. Open <b>My Purchases</b> to download your templates{hasApp ? " and see your app login" : ""}.</li>
        {hasApp && <li>3. Open the app, sign in, and set your own password.</li>}
      </ol>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href={orderId ? `/account/purchases/${orderId}` : "/account/login"} size="lg">Go to My Purchases</ButtonLink>
        <ButtonLink href="/" variant="outline" size="lg">Back to store</ButtonLink>
      </div>
    </Container>
  );
}
