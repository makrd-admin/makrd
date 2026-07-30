import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request so Server Components
 * always see a valid (non-expired) session. Must run in middleware since
 * Server Components can't write cookies themselves.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not remove: this call refreshes the session and must run before any
  // other logic that reads cookies, or the refreshed session won't persist.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAppRoute = !pathname.startsWith("/api") && !pathname.startsWith("/auth");

  if (user && isAppRoute) {
    // Every signed-in member must have a unique username before doing
    // anything else — gate every route except the page that sets one.
    if (pathname !== "/complete-profile") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (!profile?.username) {
        const url = request.nextUrl.clone();
        url.pathname = "/complete-profile";
        return NextResponse.redirect(url);
      }
    }

    // Log real navigations only — skip Next's own background prefetch
    // requests (they carry this header) so "who visited what" isn't
    // inflated by links the user merely hovered over or scrolled past.
    if (request.method === "GET" && !request.headers.get("next-router-prefetch")) {
      await supabase.rpc("log_page_view", { p_path: pathname });
    }
  }

  return supabaseResponse;
}
