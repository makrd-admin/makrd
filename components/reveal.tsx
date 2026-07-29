"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Fades and slides its children up into place the first time they scroll into view. */
export default function Reveal({
  children,
  delayMs = 0,
  className = "",
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        node,
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          delay: delayMs / 1000,
          ease: "power3.out",
          scrollTrigger: {
            trigger: node,
            start: "top 88%",
            once: true,
          },
        },
      );
    });

    return () => ctx.revert();
  }, [delayMs]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
