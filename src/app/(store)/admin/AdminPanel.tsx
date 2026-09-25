"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CopyField } from "@/components/account/CopyField";
import { notify } from "@/components/ui/Toaster";

type Order = { id: string; email: string; total: number; status: string; provider: string | null; created_at: string; app_credentials: { username: string; password_changed: boolean }[] };
type Tpl = { id: string; title: string; category: string; product_id: string };
type Prod = { id: string; name: string };

const input = "h-11 w-full rounded-lg border border-ink/25 bg-white px-3 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-lime";
const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
    <h2 className="font-display text-xl font-extrabold">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
);

async function post(url: string, body: unknown) {
  const isForm = body instanceof FormData;
  const res = await fetch(url, { method: "POST", headers: isForm ? undefined : { "content-type": "application/json" }, body: isForm ? body : JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json;
}

export function AdminPanel({ orders, templates, products, appUrl }: { orders: Order[]; templates: Tpl[]; products: Prod[]; appUrl: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState<{ email: string; customerPassword?: string; appCredential?: { username: string; tempPassword: string }; orderId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState(appUrl);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); router.refresh(); } catch (e) { notify(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  };

  const record = (e: FormEvent) => { e.preventDefault(); run(async () => {
    const r = await post("/api/checkout/fulfill", { email, productIds: picked, provider: "manual" });
    setResult({ ...r, email });
    notify("Purchase recorded");
  }); };

  const upload = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const form = e.currentTarget; run(async () => {
    await post("/api/admin/template", new FormData(form));
    form.reset();
    notify("Template uploaded");
  }); };

  return (
    <div className="mt-8 grid gap-6">
      <Card title="Record a purchase">
        <form onSubmit={record} className="grid gap-4">
          <input className={input} type="email" required placeholder="Customer email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {products.map((p) => (
              <label key={p.id} className={`cursor-pointer rounded-lg border-2 px-3 py-2 text-sm transition ${picked.includes(p.id) ? "border-ink bg-lime" : "border-line hover:border-ink/40"}`}>
                <input type="checkbox" className="sr-only" checked={picked.includes(p.id)} onChange={() => setPicked((s) => s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id])} />
                {p.name}
              </label>
            ))}
          </div>
          <Button type="submit" disabled={busy || !picked.length}>Create order &amp; account</Button>
        </form>
        {result && (
          <div className="mt-5 space-y-3 rounded-xl bg-mist p-4">
            <p className="text-sm font-semibold">Order {result.orderId.slice(0, 8).toUpperCase()} created for {result.email}. Send these to the customer:</p>
            {result.customerPassword ? <CopyField label="Portal password (new account)" value={result.customerPassword} secret /> : <p className="text-xs text-ink/60">Existing customer — they sign in with their current password.</p>}
            {result.appCredential && (<><CopyField label="App username" value={result.appCredential.username} /><CopyField label="App temporary password" value={result.appCredential.tempPassword} secret /></>)}
          </div>
        )}
      </Card>

      <Card title="Live app URL">
        <form onSubmit={(e) => { e.preventDefault(); run(async () => { await post("/api/admin/settings", { appUrl: url }); notify("App URL saved"); }); }} className="flex flex-col gap-3 sm:flex-row">
          <input className={input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://app.yourdomain.com" />
          <Button type="submit" disabled={busy}>Save</Button>
        </form>
        <p className="mt-2 text-xs text-ink/55">Shown to every customer in My Purchases → Open the app.</p>
      </Card>

      <Card title="Upload a template (PDF)">
        <form onSubmit={upload} className="grid gap-3 sm:grid-cols-2">
          <input className={input} name="title" required placeholder="Title (e.g. Weekly Planner 2.0)" />
          <input className={input} name="category" placeholder="Category (e.g. Planner)" />
          <select className={input} name="productId" required defaultValue="habit-full">
            {products.filter((p) => p.id !== "second-brain" && p.id !== "bundle").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input className={`${input} pt-2`} type="file" name="file" accept="application/pdf" required />
          <div className="sm:col-span-2"><Button type="submit" disabled={busy}>Upload</Button></div>
        </form>
        <ul className="mt-5 divide-y divide-line text-sm">
          {templates.map((t) => <li key={t.id} className="flex justify-between gap-3 py-2"><span>{t.title}</span><span className="text-ink/55">{t.product_id}</span></li>)}
          {!templates.length && <li className="py-2 text-ink/55">No templates uploaded yet.</li>}
        </ul>
      </Card>

      <Card title="Recent orders">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase text-ink/55"><tr><th className="py-2">Order</th><th>Email</th><th>Total</th><th>App login</th><th /></tr></thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-2 font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td>{o.email}</td>
                  <td>Rs. {o.total}</td>
                  <td className="text-xs">{o.app_credentials.map((c) => `${c.username}${c.password_changed ? " ✓" : ""}`).join(", ") || "—"}</td>
                  <td className="text-right"><button className="cursor-pointer text-xs font-semibold underline" disabled={busy} onClick={() => run(async () => { await post("/api/admin/app-credential", { orderId: o.id }); notify("New app login issued — see My Purchases for that order"); })}>+ app login</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
