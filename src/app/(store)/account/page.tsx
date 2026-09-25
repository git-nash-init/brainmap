import type { Metadata } from "next";
import Link from "next/link";
import { requireUser, isAdmin } from "@/lib/auth";
import { Container } from "@/components/ui/Section";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/Reveal";
import { SignOutButton } from "@/components/account/SignOutButton";
import { ButtonLink } from "@/components/ui/Button";
import { inr } from "@/content/products";
import { productsOf } from "@/lib/rel";

export const metadata: Metadata = { title: "My Purchases" };

const kindLabel: Record<string, string> = { template: "Printable templates", app: "App · login included", bundle: "Bundle · templates + app" };

export default async function AccountPage() {
  const { supabase, user } = await requireUser();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, total, created_at, status, order_items(product_id, products(id, name, kind))")
    .order("created_at", { ascending: false });

  return (
    <Container className="max-w-4xl py-12 md:py-16">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">My account</p>
          <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight">My Purchases</h1>
          <p className="mt-1 text-sm text-ink/60">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin(user) && <ButtonLink href="/admin" variant="lime">Admin</ButtonLink>}
          <SignOutButton />
        </div>
      </Reveal>

      {!orders?.length ? (
        <Reveal className="mt-10 rounded-2xl border border-dashed border-ink/30 p-10 text-center">
          <p className="font-semibold">No purchases yet.</p>
          <p className="mt-1 text-sm text-ink/60">Once you buy a product it will appear here instantly.</p>
          <div className="mt-5"><ButtonLink href="/collections/all">Browse products</ButtonLink></div>
        </Reveal>
      ) : (
        <Stagger className="mt-10 space-y-4">
          {orders.map((o) => {
            const items = productsOf(o.order_items);
            return (
              <StaggerItem key={o.id}>
                <Link href={`/account/purchases/${o.id}`} className="group block rounded-2xl border border-line bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink/55">
                    <span>Order {o.id.slice(0, 8).toUpperCase()} · {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="rounded-full bg-lime px-2.5 py-1 font-bold uppercase text-ink">{o.status}</span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {items.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3">
                        <span>
                          <span className="block font-bold">{p.name}</span>
                          <span className="text-xs text-ink/55">{kindLabel[p.kind]}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
                    <span className="text-ink/60">Total {inr(o.total)}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-brand transition-all group-hover:gap-2">Open <span aria-hidden>→</span></span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </Container>
  );
}
