"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Hides its children when the user scrolls down past a small threshold, and
 * shows them again on scroll up or near the top — keeps the floating nav
 * pill from permanently overlapping page content while scrolling.
 */
export default function ScrollHide({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      const scrollingDown = y > lastY.current + 4;
      const scrollingUp = y < lastY.current - 4;
      if (y < 80) {
        setHidden(false);
      } else if (scrollingDown) {
        setHidden(true);
      } else if (scrollingUp) {
        setHidden(false);
      }
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`sticky top-4 z-40 flex justify-center px-4 transition-transform duration-300 ease-out ${
        hidden ? "-translate-y-32" : "translate-y-0"
      }`}
    >
      {children}
    </div>
  );
}
