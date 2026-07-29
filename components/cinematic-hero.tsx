"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LogoMark from "./logo-mark";
import SkipperLoadingScene from "./skipper-loading-scene";

gsap.registerPlugin(ScrollTrigger);

const HEADLINE_WORDS = ["Get", "anything", "3D printed", "by someone", "near", "you."];

export default function CinematicHero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const modelWrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance: headline words stagger up into place, then the rest of
      // the hero fades in behind them.
      gsap.fromTo(
        ".hero-word",
        { yPercent: 120, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.9, ease: "power4.out", stagger: 0.08 },
      );
      gsap.fromTo(
        ".hero-fade-in",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.5, ease: "power2.out", stagger: 0.1 },
      );

      // Scroll-driven parallax on the 3D model — drifts and tilts opposite
      // to scroll direction as the hero leaves the viewport, giving the
      // scene a sense of depth without touching the Three.js internals.
      if (modelWrapRef.current) {
        gsap.to(modelWrapRef.current, {
          yPercent: -18,
          rotateZ: -3,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
          },
        });
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div className="flex flex-col items-start gap-6">
        <div className="hero-fade-in flex items-center gap-2 opacity-0">
          <LogoMark size={32} />
          <span className="text-gradient text-lg font-semibold">maKrd</span>
        </div>
        <h1 className="text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
          {HEADLINE_WORDS.map((word, i) => (
            <span key={i} className="mr-3 inline-block overflow-hidden align-bottom">
              <span className={`hero-word inline-block ${i === 2 ? "text-gradient" : ""}`}>
                {word}
              </span>
            </span>
          ))}
        </h1>
        <p className="hero-fade-in max-w-xl text-lg text-neutral-600 opacity-0 dark:text-neutral-400">
          A community-owned, peer-to-peer printing network. Pay in points — earn them by printing
          for others, or top up anytime.
        </p>
        <div className="hero-fade-in flex flex-wrap items-center gap-3 opacity-0">
          <a
            href="/login"
            className="btn-gradient rounded-full px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Sign in with Google
          </a>
          <a
            href="/announcements"
            className="rounded-full px-5 py-3 text-sm font-medium text-neutral-600 underline underline-offset-4 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            See what&apos;s coming
          </a>
        </div>
      </div>
      <div ref={modelWrapRef} className="flex justify-center lg:justify-end">
        <SkipperLoadingScene size={360} />
      </div>
    </div>
  );
}
