export default function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent-from)" />
          <stop offset="50%" stopColor="var(--accent-via)" />
          <stop offset="100%" stopColor="var(--accent-to)" />
        </linearGradient>
      </defs>
      {/* stacked print layers, narrowing upward */}
      <rect x="4" y="24" width="24" height="4" rx="1.5" fill="url(#logoGradient)" />
      <rect x="7" y="18" width="18" height="4" rx="1.5" fill="url(#logoGradient)" opacity="0.85" />
      <rect x="10" y="12" width="12" height="4" rx="1.5" fill="url(#logoGradient)" opacity="0.7" />
      <rect x="13" y="6" width="6" height="4" rx="1.5" fill="url(#logoGradient)" opacity="0.55" />
    </svg>
  );
}
