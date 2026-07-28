const HULL_PATH =
  "M40 160 Q30 160 30 150 L30 130 Q30 120 45 118 L90 115 L90 90 L150 90 L150 115 L195 118 Q205 122 208 132 L210 150 Q210 160 200 160 Z";

type Props = {
  size?: number;
  caption?: string;
};

/**
 * A more elaborate variant of PrinterLoader for the full-screen loading state
 * only — pseudo-3D shading, a layer-line texture clipped to the hull, and a
 * glowing hot-end, wrapped in a CSS perspective rig that gently orbits.
 * Still pure SVG/CSS (see .realistic-loader-* in globals.css) — no 3D engine.
 */
export default function PrinterLoaderRealistic({ size = 220, caption }: Props) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="realistic-loader-scene" style={{ width: size, height: size }}>
        <div className="realistic-loader-rig h-full w-full">
          <svg
            width={size}
            height={size}
            viewBox="0 0 240 210"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hullShade" x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0%" stopColor="var(--accent-to)" />
                <stop offset="45%" stopColor="var(--accent-via)" />
                <stop offset="100%" stopColor="var(--accent-from)" />
              </linearGradient>
              <radialGradient id="bedShine" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="hotendGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff7ed" />
                <stop offset="40%" stopColor="var(--accent-warm)" />
                <stop offset="100%" stopColor="var(--accent-warm)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="nozzleMetal" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.9" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
              </linearGradient>
              <clipPath id="hullClip">
                <path d={HULL_PATH} />
              </clipPath>
            </defs>

            {/* build plate, perspective grid */}
            <ellipse cx="120" cy="172" rx="100" ry="14" fill="url(#bedShine)" />
            <ellipse
              cx="120"
              cy="172"
              rx="100"
              ry="14"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="1.5"
            />
            <ellipse
              cx="120"
              cy="172"
              rx="66"
              ry="9"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeWidth="1"
            />

            {/* ground shadow under the model */}
            <ellipse cx="120" cy="163" rx="70" ry="8" fill="black" opacity="0.18" />

            {/* gantry rail */}
            <line
              x1="15"
              y1="28"
              x2="225"
              y2="28"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* ghost target outline */}
            <path
              d={HULL_PATH}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="2"
            />
            <rect
              x="115"
              y="65"
              width="10"
              height="25"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="2"
            />

            {/* printed hull with layer-line texture, scales up from the plate */}
            <g className="printer-loader-hull">
              <path d={HULL_PATH} fill="url(#hullShade)" />
              <rect x="115" y="65" width="10" height="25" fill="url(#hullShade)" />
              <g clipPath="url(#hullClip)" opacity="0.35">
                {Array.from({ length: 14 }).map((_, i) => (
                  <line
                    key={i}
                    x1="20"
                    x2="220"
                    y1={90 + i * 5}
                    y2={90 + i * 5}
                    stroke="black"
                    strokeOpacity="0.18"
                    strokeWidth="1"
                  />
                ))}
              </g>
              <path
                d="M40 160 Q30 160 30 150 L30 130 Q30 120 45 118 L90 115"
                fill="none"
                stroke="white"
                strokeOpacity="0.35"
                strokeWidth="2"
              />

              {/* mascot face on the cabin — this Benchy is our mascot */}
              <circle cx="112" cy="101" r="5.5" fill="white" />
              <circle cx="132" cy="101" r="5.5" fill="white" />
              <circle cx="113.5" cy="101" r="2.6" fill="#171717" />
              <circle cx="133.5" cy="101" r="2.6" fill="#171717" />
              <circle cx="112.5" cy="99.5" r="1" fill="white" />
              <circle cx="132.5" cy="99.5" r="1" fill="white" />
              <path
                d="M116 109 Q122 113 128 109"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>

            {/* print head: arm + metallic nozzle + glowing hot-end */}
            <g className="printer-loader-nozzle">
              <line x1="120" y1="28" x2="120" y2="55" stroke="url(#nozzleMetal)" strokeWidth="4" />
              <path d="M108 55 L132 55 L122 70 L118 70 Z" fill="url(#nozzleMetal)" />
              <circle
                cx="120"
                cy="68"
                r="7"
                fill="url(#hotendGlow)"
                className="realistic-loader-hotend"
              />
              <circle cx="120" cy="68" r="2.2" fill="#fff7ed" />
              <path
                d="M120 62 Q116 54 120 46"
                fill="none"
                stroke="white"
                strokeOpacity="0.4"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="realistic-loader-steam"
              />
            </g>
          </svg>
        </div>
      </div>
      {caption && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400" role="status">
          {caption}
        </p>
      )}
    </div>
  );
}
