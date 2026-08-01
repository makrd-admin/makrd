"use client";

import dynamic from "next/dynamic";
import LogoMark from "./logo-mark";

function LoadingFallback({ size = 220 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="logo-pulse">
        <LogoMark size={Math.round(size * 0.32)} />
      </div>
    </div>
  );
}

// WebGL doesn't exist server-side, and the geometry/lighting setup is a
// meaningful chunk of JS — load it client-only. The fallback below is
// deliberately just the brand mark (not a distinct illustrated scene): an
// earlier version fell back to the old pre-redesign printer illustration,
// which meant every single page load flashed outdated art before the real
// model swapped in — read as "the site keeps showing old stuff." A plain
// pulsing version of the current logo can't go stale the same way.
const Skipper3D = dynamic(() => import("./skipper-3d"), {
  ssr: false,
  loading: () => <LoadingFallback />,
});

export default function SkipperLoadingScene({ size }: { size?: number }) {
  return <Skipper3D size={size} />;
}
