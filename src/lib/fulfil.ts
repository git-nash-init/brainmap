import "server-only";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const APP_EMAIL_DOMAIN = "app.brainmap.invalid";

const genPassword = () => randomBytes(9).toString("base64url"); // 12 chars
const genUsername = () => `bm-${randomBytes(4).toString("hex")}`;

export type PurchaseInput = {
  email: string;
  productIds: string[];
  provider?: string;
  providerRef?: string;
  /** Password for a brand-new customer account (random if omitted). Ignored for existing customers. */
  password?: string;
};

export type PurchaseResult = {
  orderId: string;
  userId: string;
  newAccount: boolean;
  /** Only set when a brand-new customer account was created. Hand this to the customer (or let them use "forgot password"). */
  customerPassword?: string;
  appCredential?: { username: string; tempPassword: string };
};

/** Creates (or reuses) the customer account, records a paid order and issues app credentials when needed. */
export async function recordPurchase(input: PurchaseInput): Promise<PurchaseResult> {
  const admin = createAdminClient();
  const email = input.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Invalid email");
  if (!input.productIds.length) throw new Error("No products selected");

  const { data: products, error: pErr } = await admin.from("products").select("id, price").in("id", input.productIds);
  if (pErr) throw pErr;
  if (!products || products.length !== new Set(input.productIds).size) throw new Error("Unknown product id");
  const total = products.reduce((n, p) => n + p.price, 0);

  // idempotency for webhooks
  if (input.provider && input.providerRef) {
    const { data: existing } = await admin.from("orders").select("id, user_id").eq("provider", input.provider).eq("provider_ref", input.providerRef).maybeSingle();
    if (existing) return { orderId: existing.id, userId: existing.user_id, newAccount: false };
  }

  // customer account
  let { data: userId } = await admin.rpc("find_user_id_by_email", { p_email: email });
  let customerPassword: string | undefined;
  let newAccount = false;
  if (!userId) {
    customerPassword = input.password ?? genPassword();
    const { data, error } = await admin.auth.admin.createUser({ email, password: customerPassword, email_confirm: true, app_metadata: { kind: "customer" } });
    if (error || !data.user) throw error ?? new Error("Could not create user");
    userId = data.user.id;
    newAccount = true;
  }

  const { data: order, error: oErr } = await admin
    .from("orders")
    .insert({ user_id: userId, email, status: "paid", provider: input.provider ?? "manual", provider_ref: input.providerRef ?? null, total })
    .select("id")
    .single();
  if (oErr) throw oErr;
  const { error: iErr } = await admin.from("order_items").insert(input.productIds.map((product_id) => ({ order_id: order.id, product_id })));
  if (iErr) throw iErr;

  let appCredential: PurchaseResult["appCredential"];
  if (input.productIds.some((p) => p === "second-brain" || p === "bundle")) {
    appCredential = await issueAppCredential(order.id, userId as string);
  }
  return { orderId: order.id, userId: userId as string, newAccount, customerPassword, appCredential };
}

/** Creates a fresh app login (username + temporary password) linked to an order. */
export async function issueAppCredential(orderId: string, ownerUserId: string) {
  const admin = createAdminClient();
  const username = genUsername();
  const tempPassword = genPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email: `${username}@${APP_EMAIL_DOMAIN}`,
    password: tempPassword,
    email_confirm: true,
    app_metadata: { kind: "app", owner: ownerUserId },
  });
  if (error || !data.user) throw error ?? new Error("Could not create app user");
  const { error: cErr } = await admin.from("app_credentials").insert({
    order_id: orderId,
    owner_user_id: ownerUserId,
    app_user_id: data.user.id,
    username,
    temp_password: tempPassword,
  });
  if (cErr) throw cErr;
  return { username, tempPassword };
}
