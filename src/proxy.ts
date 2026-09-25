import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Keeps the Supabase auth session fresh and guards /account and /admin. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims;
  const path = request.nextUrl.pathname;
  const publicAccount = path === "/account/login" || path === "/account/reset";
  const needsAuth = (path.startsWith("/account") && !publicAccount) || path.startsWith("/admin");

  if (needsAuth && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/account/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
