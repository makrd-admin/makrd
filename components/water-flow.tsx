import type { ReactNode } from "react";

/**
 * A stylized (not physically simulated) flowing-water transition: layered
 * wave paths drift horizontally in a loop while the Benchy hull bobs on
 * the surface, carrying the page down into whatever sits inside `children`
 * (the sign-in CTA). Pure CSS/SVG — no shader/physics engine, consistent
 * with every other animation in this app.
 */
export default function WaterFlow({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <svg
        viewBox="0 0 800 40"
        preserveAspectRatio="none"
        className="block h-10 w-full text-[var(--accent-via)]"
        aria-hidden="true"
      >
        <path
          d="M0 40 L0 20 Q100 0 200 20 T400 20 T600 20 T800 20 L800 40 Z"
          fill="currentColor"
          opacity="0.15"
        />
      </svg>

      <div
        className="relative"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--accent-via) 15%, transparent), color-mix(in srgb, var(--accent-from) 35%, transparent))",
        }}
      >
        <svg viewBox="0 0 800 90" preserveAspectRatio="none" className="block h-24 w-full">
          <g className="water-wave-1">
            <path
              d="M-200 45 Q-100 20 0 45 T200 45 T400 45 T600 45 T800 45 T1000 45 V90 H-200 Z"
              fill="var(--accent-via)"
              opacity="0.35"
            />
          </g>
          <g className="water-wave-2">
            <path
              d="M-200 55 Q-100 35 0 55 T200 55 T400 55 T600 55 T800 55 T1000 55 V90 H-200 Z"
              fill="var(--accent-from)"
              opacity="0.55"
            />
          </g>
        </svg>

        {/* the benchy hull, adrift and bobbing on the surface */}
        <div className="water-boat-drift pointer-events-none absolute top-2 left-0">
          <svg
            width="60"
            height="34"
            viewBox="0 0 240 176"
            className="water-boat-bob text-white/90 drop-shadow-lg"
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
