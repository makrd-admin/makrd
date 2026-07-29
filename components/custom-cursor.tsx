"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

/**
 * A decorative glass ring that follows the pointer on the landing page.
 * The native OS cursor is never hidden — this only ever draws on top of
 * it — so unlike an earlier version (which hid the native cursor from
 * load and made the page briefly unclickable if the custom one failed to
 * render), a failure here can't break clicking. Active across the whole
 * landing page from the first mouse move, not just near the bottom.
 * Disabled on touch devices and on every route other than "/", where it
 * was designed to live as a flourish rather than a sitewide UI element.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const moveDot = gsap.quickTo(dot, "x", { duration: 0.05, ease: "power3.out" });
    const moveDotY = gsap.quickTo(dot, "y", { duration: 0.05, ease: "power3.out" });
    const moveRing = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
    const moveRingY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });

    let revealed = false;
    function onMove(e: MouseEvent) {
      moveDot(e.clientX);
      moveDotY(e.clientY);
      moveRing(e.clientX);
      moveRingY(e.clientY);
      if (!revealed) {
        revealed = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.4 });
      }
    }

    document.addEventListener("mousemove", onMove);

    return () => {
      document.removeEventListener("mousemove", onMove);
      gsap.set([dot, ring], { opacity: 0 });
    };
  }, [pathname]);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-glow" aria-hidden="true" />
    </>
  );
}
