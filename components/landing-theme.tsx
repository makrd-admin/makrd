"use client";

import { useEffect } from "react";

/**
 * Swaps the site's vibrant blue/violet/pink accent for a natural green
 * palette (see :root.theme-landing-green in globals.css) while the
 * landing page is mounted, then restores the default on unmount. Scoped
 * to <html> rather than a wrapper div so it also reaches the nav (sign-in
 * button, logo mark), which renders in the root layout outside this
 * page's own markup — the rest of the app keeps the vibrant theme.
 */
export default function LandingTheme() {
  useEffect(() => {
    document.documentElement.classList.add("theme-landing-green");
    return () => {
      document.documentElement.classList.remove("theme-landing-green");
    };
  }, []);

  return null;
}
