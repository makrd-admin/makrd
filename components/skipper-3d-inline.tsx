"use client";

import dynamic from "next/dynamic";
import MascotFace from "./mascot-face";

// Same client-only pattern as the loading screen's Skipper3D — WebGL can't
// render server-side, and only worth the chunk fetch when the mascot panel
// is actually open (the collapsed corner button stays on the flat SVG face
// so a 3D canvas isn't mounted on every single page load).
const Skipper3D = dynamic(() => import("./skipper-3d"), {
  ssr: false,
  loading: () => <MascotFace size={72} />,
});

export default function Skipper3DInline({ size = 72 }: { size?: number }) {
  return <Skipper3D size={size} />;
}
