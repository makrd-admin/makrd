import type { ReactNode } from "react";

/**
 * A stylized (not physically simulated) flowing-water transition. Wave
 * paths run through an SVG turbulence/displacement filter so their edges
 * are irregular rather than perfect sine curves, three drift layers move
 * at different speeds for depth, and a caustics-light overlay plus a
 * diagonal sheen animate on top to read as light moving on a real
 * surface. The Benchy hull bobs on top, carrying the page down into
 * whatever sits inside `children` (the sign-in CTA). Uses --water-* CSS
 * vars (real blue tones) rather than the site's accent gradient, so this
 * always reads as actual water regardless of the brand palette. Pure
 * CSS/SVG — no shader/physics engine, consistent with every other
 * animation in this app.
 */
export default function WaterFlow({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <svg
        viewBox="0 0 800 40"
        preserveAspectRatio="none"
        className="block h-10 w-full"
        aria-hidden="true"
      >
        <path
          d="M0 40 L0 20 Q100 0 200 20 T400 20 T600 20 T800 20 L800 40 Z"
          fill="var(--water-foam)"
          opacity="0.9"
        />
      </svg>

      <div
        className="relative"
        style={{
          background:
            "linear-gradient(180deg, var(--water-light), var(--water-mid) 45%, var(--water-deep))",
        }}
      >
        <svg viewBox="0 0 800 90" preserveAspectRatio="none" className="block h-24 w-full">
          <defs>
            <filter id="water-turbulence" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012 0.05"
                numOctaves="2"
                seed="4"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="9"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
          <g filter="url(#water-turbulence)">
            <g className="water-wave-1">
              <path
                d="M-200 30 Q-100 8 0 30 T200 30 T400 30 T600 30 T800 30 T1000 30 V38 Q-100 20 -200 38 Z"
                fill="var(--water-foam)"
                opacity="0.7"
              />
            </g>
            <g className="water-wave-3">
              <path
                d="M-320 40 Q-220 24 -120 40 T80 40 T280 40 T480 40 T680 40 T880 40 T1080 40 V90 H-320 Z"
                fill="var(--water-light)"
                opacity="0.5"
              />
            </g>
            <g className="water-wave-1">
              <path
                d="M-200 45 Q-100 20 0 45 T200 45 T400 45 T600 45 T800 45 T1000 45 V90 H-200 Z"
                fill="var(--water-mid)"
                opacity="0.7"
              />
            </g>
            <g className="water-wave-2">
              <path
                d="M-200 55 Q-100 35 0 55 T200 55 T400 55 T600 55 T800 55 T1000 55 V90 H-200 Z"
                fill="var(--water-deep)"
                opacity="0.8"
              />
            </g>
          </g>
        </svg>

        {/* caustics — dappled light patterns drifting across the surface,
            the classic CSS trick for making a flat gradient read as real
            water instead of a solid fill */}
        <div
          className="water-caustics pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 120px 40px at 20% 30%, rgba(255,255,255,0.5), transparent 60%)," +
              "radial-gradient(ellipse 160px 50px at 70% 60%, rgba(255,255,255,0.35), transparent 60%)",
            backgroundSize: "400px 200px, 500px 240px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* a soft diagonal sheen sweeping over the surface like reflected
            light — subtle, low-opacity, purely decorative */}
        <div
          className="water-sheen pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
          }}
        />

        {/* the benchy hull, adrift and bobbing on the surface */}
        <div className="water-boat-drift pointer-events-none absolute top-2 left-0">
          <svg
            width="60"
            height="34"
            viewBox="0 0 240 176"
            className="water-boat-bob text-white drop-shadow-lg"
          >
            <path
              d="M40 160 Q30 160 30 150 L30 130 Q30 120 45 118 L90 115 L90 90 L150 90 L150 115 L195 118 Q205 122 208 132 L210 150 Q210 160 200 160 Z"
              fill="currentColor"
            />
            <rect x="115" y="65" width="10" height="25" fill="currentColor" />
          </svg>
        </div>

        <div className="relative px-6 py-16 sm:px-10 sm:py-20">{children}</div>
      </div>
    </div>
  );
}
