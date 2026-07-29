"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * No custom cursor for most of the page — the native OS pointer is always
 * what's driving clicks. Once the user scrolls down to the
 * #cursor-activate-marker element (placed just before the final sign-in
 * section on the landing page), a soft glowing ring takes over from the
 * native cursor as a closing flourish. Scrolling back up restores the
 * native cursor.
 *
 * Position tracking runs the whole time (cheap), but the glow is only
 * ever shown once the marker has actually been reached — so even if
 * something here breaks, the native cursor was never hidden and nothing
 * becomes unclickable. Disabled entirely on touch devices.
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
    const moveRing = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
    const moveRingY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });

    function onMove(e: MouseEvent) {
      moveDot(e.clientX);
      moveDotY(e.clientY);
      moveRing(e.clientX);
      moveRingY(e.clientY);
    }

    document.addEventListener("mousemove", onMove);

    const marker = document.getElementById("cursor-activate-marker");
    let trigger: ScrollTrigger | undefined;
    if (marker) {
      trigger = ScrollTrigger.create({
        trigger: marker,
        start: "top 90%",
        onEnter: () => {
          document.body.classList.add("custom-cursor-active");
          gsap.to([dot, ring], { opacity: 1, duration: 0.4 });
        },
        onLeaveBack: () => {
          document.body.classList.remove("custom-cursor-active");
          gsap.to([dot, ring], { opacity: 0, duration: 0.3 });
        },
      });
    }

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.body.classList.remove("custom-cursor-active");
      trigger?.kill();
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-glow" aria-hidden="true" />
    </>
  );
}
