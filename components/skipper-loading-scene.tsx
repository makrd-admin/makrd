"use client";

import dynamic from "next/dynamic";
import PrinterLoaderRealistic from "./printer-loader-realistic";

// WebGL doesn't exist server-side, and the geometry/lighting setup is a
// meaningful chunk of JS — load it client-only, falling back to the SVG
// loader (instant, no chunk fetch) while it comes in.
const Skipper3D = dynamic(() => import("./skipper-3d"), {
  ssr: false,
  loading: () => <PrinterLoaderRealistic caption="Warming up the nozzle…" />,
});

export default function SkipperLoadingScene({ size }: { size?: number }) {
  return <Skipper3D size={size} />;
}
