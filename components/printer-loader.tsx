type PrinterLoaderProps = {
  size?: number;
  caption?: string;
  className?: string;
};

/**
 * A nozzle sweeping back and forth over a boat hull that fills upward —
 * pure SVG + CSS keyframes (see .printer-loader-* in globals.css), no
 * animation library needed.
 */
export default function PrinterLoader({ size = 160, caption, className }: PrinterLoaderProps) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hullGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-from)" />
            <stop offset="50%" stopColor="var(--accent-via)" />
            <stop offset="100%" stopColor="var(--accent-to)" />
          </linearGradient>
        </defs>

        {/* gantry rail */}
        <line
          x1="20"
          y1="30"
          x2="220"
          y2="30"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* build plate */}
        <line
          x1="20"
          y1="160"
          x2="220"
          y2="160"
          stroke="currentColor"
          strokeOpacity="0.3"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* ghost target outline */}
        <path
          d="M40 160 Q30 160 30 150 L30 130 Q30 120 45 118 L90 115 L90 90 L150 90 L150 115 L195 118 Q205 122 208 132 L210 150 Q210 160 200 160 Z"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="2"
        />
        <rect
          x="115"
          y="65"
          width="10"
          height="25"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="2"
        />

        {/* printed hull, scales up from the build plate */}
        <g className="printer-loader-hull">
          <path
            d="M40 160 Q30 160 30 150 L30 130 Q30 120 45 118 L90 115 L90 90 L150 90 L150 115 L195 118 Q205 122 208 132 L210 150 Q210 160 200 160 Z"
            fill="url(#hullGradient)"
          />
          <rect x="115" y="65" width="10" height="25" fill="url(#hullGradient)" />
        </g>

        {/* print head: arm + nozzle, sweeps left-right along the gantry */}
        <g className="printer-loader-nozzle">
          <line x1="120" y1="30" x2="120" y2="55" stroke="currentColor" strokeWidth="3" />
          <path d="M110 55 L130 55 L123 68 L117 68 Z" fill="var(--accent-warm)" />
          <circle
            cx="120"
            cy="66"
            r="4"
            fill="var(--accent-warm)"
            className="printer-loader-glow"
          />
        </g>
      </svg>
      {caption && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400" role="status">
          {caption}
        </p>
      )}
    </div>
  );
}
