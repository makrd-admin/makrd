"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useBenchyGeometry } from "./benchy-model";
import LogoMark from "./logo-mark";

gsap.registerPlugin(ScrollTrigger);

const STAGES = [
  {
    kicker: "Peer-to-peer 3D printing",
    title: "Get anything printed by someone near you.",
    body: "A community-owned network, not a warehouse. Every job goes to a real member with a real printer.",
  },
  {
    kicker: "Submit a job",
    title: "Upload a model, get a price up front.",
    body: "STL, 3MF, STEP, or OBJ. Weight is estimated straight from the file's geometry — no guessing.",
  },
  {
    kicker: "Get matched automatically",
    title: "A free printer nearby picks it up.",
    body: "No one free right now? It lists on the open marketplace until someone accepts it.",
  },
  {
    kicker: "Meet the Benchy",
    title: "The unofficial mascot of every 3D printer ever calibrated.",
    body: "This is a real, unmodified 3DBenchy model — the classic torture-test print makers use to judge a printer's quality.",
  },
];

function ScrollBenchy({ progressRef }: { progressRef: React.RefObject<number> }) {
  const geometry = useBenchyGeometry();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    const p = progressRef.current;
    if (groupRef.current) {
      groupRef.current.scale.setScalar(THREE.MathUtils.clamp(p * 3, 0.03, 1));
    }
    const angle = p * Math.PI * 1.7;
    const radius = 3.4;
    const height = 0.6 + Math.sin(p * Math.PI) * 1.1;
    camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial color="#16a34a" roughness={0.4} metalness={0.1} clearcoat={0.4} />
      </mesh>
    </group>
  );
}

function BuildPlate() {
  return (
    <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[2.4, 48]} />
      <meshStandardMaterial color="#0a0f0b" roughness={0.6} metalness={0.4} />
    </mesh>
  );
}

/**
 * A pinned, scroll-scrubbed scene: the real Benchy model builds up from
 * the plate while the camera orbits around it (POV drifting around the
 * model, not the model spinning in place) as the user scrolls through
 * this section. Text panels swap alongside it at fixed progress
 * checkpoints, covering the product pitch and a "meet the model" beat.
 * Camera/scale updates happen imperatively via a ref read each frame —
 * scroll position never triggers a React re-render for the 3D side.
 */
export default function BenchyScrollScene() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: wrapRef.current,
        start: "top top",
        end: "+=300%",
        pin: true,
        scrub: 0.4,
        onUpdate: (self) => {
          progressRef.current = self.progress;
          const nextStage = Math.min(STAGES.length - 1, Math.floor(self.progress * STAGES.length));
          setStage((prev) => (prev === nextStage ? prev : nextStage));
        },
      });
    }, wrapRef);

    return () => ctx.revert();
  }, []);

  const current = STAGES[stage];

  return (
    <div ref={wrapRef} className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2">
          <LogoMark size={28} />
          <span className="text-gradient text-base font-semibold">maKrd</span>
        </div>
        <a
          href="/login"
          className="btn-gradient rounded-full px-5 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Sign in
        </a>
      </div>

      <div className="absolute inset-0">
        <Canvas shadows camera={{ position: [0, 1, 3.4], fov: 42 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 2]} intensity={1.4} castShadow />
          <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#22c55e" />
          <Suspense fallback={null}>
            <ScrollBenchy progressRef={progressRef} />
          </Suspense>
          <BuildPlate />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/70 to-transparent px-6 pt-24 pb-12 sm:px-10 sm:pb-16">
        <p className="text-xs font-semibold tracking-wide text-[var(--accent-via)] uppercase">
          {current.kicker}
        </p>
        <h2 className="max-w-2xl text-3xl leading-tight font-semibold sm:text-4xl">
          {current.title}
        </h2>
        <p className="max-w-xl text-sm text-neutral-600 sm:text-base dark:text-neutral-400">
          {current.body}
        </p>
      </div>

      <div className="pointer-events-none absolute top-6 left-1/2 flex -translate-x-1/2 gap-1.5">
        {STAGES.map((_, i) => (
          <span
            key={i}
            className={`h-1 w-8 rounded-full transition-colors ${
              i === stage ? "bg-[var(--accent-via)]" : "bg-black/10 dark:bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
