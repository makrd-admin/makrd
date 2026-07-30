"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/printers", label: "Printers" },
  { href: "/jobs", label: "Jobs" },
  { href: "/community", label: "Community" },
  { href: "/messages", label: "Messages" },
  { href: "/shop", label: "Rewards" },
  // Buying points with real money (Razorpay) is on hold — points are
  // labour-driven for now. Re-add once Razorpay is ready to go live.
  { href: "/announcements", label: "Announcements" },
];

export function isLinkActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((link) => {
        const isActive = isLinkActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "btn-gradient rounded-full px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-full px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-neutral-100"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
