import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/account/login");
  return { supabase, user: data.user };
}

export const isAdmin = (user: { app_metadata?: Record<string, unknown> }) => user.app_metadata?.role === "admin";

/** For route handlers: returns the admin user or null. */
export async function getAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user && isAdmin(data.user) ? data.user : null;
}
