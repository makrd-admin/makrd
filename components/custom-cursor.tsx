"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * A trailing custom cursor — a small dot that tracks the pointer exactly,
 * and a larger ring that eases toward it (gsap.quickTo, so it lags
 * slightly and gives the drag/momentum feel used across most WebGL
 * agency sites). Grows over interactive elements. Disabled on touch
 * devices, where there's no real pointer to track.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const moveDot = gsap.quickTo(dot, "x", { duration: 0.05, ease: "power3.out" });
    const moveDotY = gsap.quickTo(dot, "y", { duration: 0.05, ease: "power3.out" });
    const moveRing = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const moveRingY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

    function onMove(e: MouseEvent) {
      moveDot(e.clientX);
      moveDotY(e.clientY);
      moveRing(e.clientX);
      moveRingY(e.clientY);
    }

    function onOver(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest("a, button, input, textarea, select");
      gsap.to(ring, { scale: target ? 1.8 : 1, duration: 0.25, ease: "power2.out" });
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.body.classList.add("custom-cursor-active");

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.body.classList.remove("custom-cursor-active");
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
