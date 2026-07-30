"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinksFor, isLinkActive } from "./nav-links";

/**
 * Hamburger button + slide-in drawer, shown only below the `sm` breakpoint.
 * The nav pill's link row doesn't fit every route label on a phone-width
 * screen (it scrolls horizontally instead, which buried most options), so
 * on small screens the links live here instead — one tap away rather than
 * a hidden horizontal scroll.
 */
export default function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close automatically on route change (tapping a link already closes it,
  // but this also covers back/forward navigation) — syncing local UI state
  // to an external signal (the URL), not deriving state from props.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        className="flex items-center justify-center rounded-full p-2 text-neutral-600 transition-colors hover:bg-black/5 sm:hidden dark:text-neutral-300 dark:hover:bg-white/10"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="absolute top-0 right-0 flex h-full w-64 max-w-[80vw] flex-col gap-1 border-l border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                Menu
              </span>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-1.5 text-neutral-500 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {navLinksFor(isAdmin).map((link) => {
              const isActive = isLinkActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={
                    isActive
                      ? "btn-gradient rounded-xl px-4 py-2.5 text-sm font-medium text-white"
                      : "rounded-xl px-4 py-2.5 text-sm text-neutral-600 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
