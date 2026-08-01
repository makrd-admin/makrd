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
  // Next's own background prefetch requests (fired for every visible <Link>
  // on a page — there are dozens across the nav/dashboard/job lists) carry
  // this header. Skipping them here isn't just about not inflating the visit
  // log: it also means a page with many links doesn't fan out into a burst
  // of extra profiles-table round trips on every render, which was making
  // this middleware slow enough to widen the window for a known @supabase/ssr
  // race (concurrent requests refreshing the same rotating token, one wins
  // and the other gets signed out) — a likely contributor to reports of the
  // site failing to load / signing out unexpectedly.
  const isPrefetch = !!request.headers.get("next-router-prefetch");

  if (user && isAppRoute && !isPrefetch) {
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

    if (request.method === "GET") {
      // Fire-and-forget: logging a visit shouldn't hold up the response.
      void supabase.rpc("log_page_view", { p_path: pathname });
    }
  }

  return supabaseResponse;
}
