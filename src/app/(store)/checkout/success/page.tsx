import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { Container } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { SuccessBurst } from "@/components/account/SuccessBurst";
import { ClaimPassword } from "@/components/account/ClaimPassword";
import { AutoRefresh } from "@/components/account/AutoRefresh";
import { catalog, inr } from "@/content/products";
import { productsOf } from "@/lib/rel";
import { completePayment, easebuzzConfigured, needsClaim, TXN_COOKIE } from "@/lib/payments";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * After payment. `?order=<uuid>` (unguessable) shows the receipt. `?txn=<id>` without an order means the gateway
 * hasn't confirmed yet: we re-verify with Easebuzz on every load and refresh until it settles.
 */
export default async function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const sp = await searchParams;
  let orderId = typeof sp.order === "string" && uuid.test(sp.order) ? sp.order : null;
  const txn = typeof sp.txn === "string" && /^[A-Za-z0-9]{6,40}$/.test(sp.txn) ? sp.txn : null;

  let confirming = false;
  if (!orderId && txn && easebuzzConfigured()) {
    const r = await completePayment(txn);
    if (r.state === "paid") orderId = r.orderId;
    else if (r.state === "pending") confirming = true;
  }

  let items: { id: string; name: string; kind: string }[] = [];
  let total = 0;
  let masked = "";
  if (orderId) {
    const { data } = await createAdminClient().from("orders").select("email, total, order_items(products(id, name, kind))").eq("id", orderId).maybeSingle();
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
  const claim = orderId ? await needsClaim((await cookies()).get(TXN_COOKIE)?.value, orderId) : false;

  if (confirming) {
    return (
      <Container className="max-w-xl py-24 text-center">
        <AutoRefresh seconds={4} />
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-ink/15 border-t-brand" aria-hidden />
        <h1 className="mt-8 font-display text-3xl font-extrabold tracking-tight">Confirming your payment…</h1>
        <p className="mt-3 text-ink/65">This usually takes a few seconds. Please don’t close this page or pay again — we’re checking with the bank.</p>
        <p className="mt-2 text-xs text-ink/45">Reference {txn}</p>
      </Container>
    );
  }
  if (!orderId && !demoKey) {
    return (
      <Container className="max-w-xl py-24 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">We couldn’t find that order</h1>
        <p className="mt-3 text-ink/65">If you just paid, sign in to My Purchases — it appears there as soon as the payment is confirmed.</p>
        <div className="mt-6"><ButtonLink href="/account" size="lg">Go to My Purchases</ButtonLink></div>
      </Container>
    );
  }

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

      {claim && orderId ? (
        <ClaimPassword orderId={orderId} />
      ) : (
        <>
          <ol className="mx-auto mt-8 max-w-md space-y-2 text-left text-sm text-ink/75">
            <li>1. Sign in with the email you used at checkout.</li>
            <li>2. Open <b>My Purchases</b> to download your templates{hasApp ? " and see your app login" : ""}.</li>
            {hasApp && <li>3. Open the app, sign in, and set your own password.</li>}
          </ol>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href={orderId ? `/account/purchases/${orderId}` : "/account/login"} size="lg">Go to My Purchases</ButtonLink>
            <ButtonLink href="/" variant="outline" size="lg">Back to store</ButtonLink>
          </div>
        </>
      )}
    </Container>
  );
}
