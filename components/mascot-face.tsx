/** Skipper's face — the same eyes/smile used on the hull in the loading screen, standalone. */
export default function MascotFace({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 44" aria-hidden="true">
      <defs>
        <linearGradient id="mascotHull" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="var(--accent-to)" />
          <stop offset="45%" stopColor="var(--accent-via)" />
          <stop offset="100%" stopColor="var(--accent-from)" />
        </linearGradient>
      </defs>
      <path
        d="M6 38 Q2 38 2 34 L2 27 Q2 23 8 22 L20 21 L20 12 L40 12 L40 21 L52 22 Q57 23 58 27 L58 34 Q58 38 54 38 Z"
        fill="url(#mascotHull)"
      />
      <rect x="27" y="4" width="6" height="9" rx="1" fill="url(#mascotHull)" />
      <circle cx="24" cy="24" r="4.5" fill="white" />
      <circle cx="36" cy="24" r="4.5" fill="white" />
      <circle cx="24.8" cy="24" r="2.1" fill="#171717" />
      <circle cx="36.8" cy="24" r="2.1" fill="#171717" />
      <circle cx="23.4" cy="22.6" r="0.8" fill="white" />
      <circle cx="35.4" cy="22.6" r="0.8" fill="white" />
      <path
        d="M27 30 Q30 33 33 30"
        fill="none"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
