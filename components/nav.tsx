import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavLinks from "./nav-links";
import MobileNav from "./mobile-nav";
import LogoMark from "./logo-mark";
import ScrollHide from "./scroll-hide";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("points_balance, is_admin")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.is_admin ?? false;

  return (
    <ScrollHide>
      <header className="glass-nav flex w-full max-w-5xl items-center justify-between gap-3 rounded-2xl px-5 py-2.5">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-1.5">
          <LogoMark size={20} />
          <span className="text-gradient text-base font-semibold">maKrd</span>
        </Link>
        <nav className="no-scrollbar hidden flex-1 items-center gap-1 overflow-x-auto sm:flex">
          <NavLinks isAdmin={isAdmin} />
        </nav>
        <div className="flex shrink-0 items-center gap-3 text-sm">
          <MobileNav isAdmin={isAdmin} />
          <Link
            href="/profile"
            className="rounded-full bg-black/5 px-3 py-1 font-medium text-neutral-700 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/15"
          >
            {profile?.points_balance ?? 0} pts
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-neutral-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
    </ScrollHide>
  );
}
