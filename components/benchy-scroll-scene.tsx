"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useBenchyGeometry } from "./benchy-model";
import LogoMark from "./logo-mark";

gsap.registerPlugin(ScrollTrigger);

const BUILD_END = 0.8; // fraction of total scroll spent building + orbiting
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
    kicker: "Fresh off the plate",
    title: "Every print gets a Benchy send-off.",
    body: "This is a real, unmodified 3DBenchy — the classic torture-test print makers use to judge a printer's quality.",
  },
];

function ScrollBenchy({ progressRef }: { progressRef: React.RefObject<number> }) {
  const geometry = useBenchyGeometry();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    const p = progressRef.current;
    const buildP = THREE.MathUtils.clamp(p / BUILD_END, 0, 1);
    const hopP = THREE.MathUtils.clamp((p - BUILD_END) / (1 - BUILD_END), 0, 1);

    if (groupRef.current) {
      groupRef.current.scale.setScalar(Math.max(0.03, buildP));
      const hopArc = Math.sin(hopP * Math.PI) * 0.9;
      groupRef.current.position.y = hopArc - hopP * 2.2;
      groupRef.current.rotation.z = hopP * 0.6;
      groupRef.current.rotation.x = hopP * 0.3;
    }

    const orbitP = Math.min(p, BUILD_END) / BUILD_END;
    const angle = orbitP * Math.PI * 1.7;
    const radius = 3.4 + hopP * 1.2;
    const height = 0.6 + Math.sin(orbitP * Math.PI) * 1.1 - hopP * 0.4;
    camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial color="#2563eb" roughness={0.4} metalness={0.1} clearcoat={0.4} />
      </mesh>
    </group>
  );
}

/** A stylized (not any specific branded machine) enclosed-printer gantry —
 * corner posts, an X-axis rail carrying a print head that rises with the
 * model's build progress. Purely decorative, no interaction with the mesh. */
function PrinterRig({ progressRef }: { progressRef: React.RefObject<number> }) {
  const headRef = useRef<THREE.Group>(null);
  const BED = 1.7;
  const RIG_HEIGHT = 2.1;

  useFrame(({ clock }) => {
    const p = progressRef.current;
    const buildP = THREE.MathUtils.clamp(p / BUILD_END, 0, 1);
    const hopP = THREE.MathUtils.clamp((p - BUILD_END) / (1 - BUILD_END), 0, 1);
    if (headRef.current) {
      headRef.current.position.y = -0.9 + buildP * 1.6;
      headRef.current.position.x = Math.sin(clock.elapsedTime * 3) * BED * 0.4;
      const mat = headRef.current.children[0] as THREE.Mesh;
      const material = mat?.material as THREE.MeshStandardMaterial | undefined;
      if (material) material.opacity = 1 - hopP;
    }
  });

  const postPositions: [number, number, number][] = [
    [-BED, RIG_HEIGHT / 2 - 0.9, -BED],
    [BED, RIG_HEIGHT / 2 - 0.9, -BED],
    [-BED, RIG_HEIGHT / 2 - 0.9, BED],
    [BED, RIG_HEIGHT / 2 - 0.9, BED],
  ];

  return (
    <group>
      {postPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.06, RIG_HEIGHT, 0.06]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, RIG_HEIGHT - 0.9, 0]} castShadow>
        <boxGeometry args={[BED * 2.1, 0.07, 0.07]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
      </mesh>
      <group ref={headRef} position={[0, -0.9, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.16, 0.22]} />
          <meshStandardMaterial color="#334155" roughness={0.25} metalness={0.6} transparent />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <coneGeometry args={[0.03, 0.08, 12]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={0.8}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

function BuildPlate() {
  return (
    <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[3.6, 3.6]} />
      <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.5} />
    </mesh>
  );
}

/**
 * A scroll-scrubbed scene: the real Benchy model builds up on a stylized
 * printer rig while the camera orbits around it (POV drifting around the
 * model, not the model spinning in place), then — in the final stretch of
 * scroll — hops off the plate in an arc and drops out of frame, handing
 * off into the water section below. Text panels swap alongside it at
 * fixed progress checkpoints.
 *
 * Uses CSS `position: sticky` on the inner viewport-height layer, driven
 * by a tall (400vh) wrapper, rather than GSAP's `pin: true`. An earlier
 * version used ScrollTrigger's pin, which inserts and measures its own
 * spacer element in the DOM — under certain layout-timing conditions that
 * measurement went stale and the pinned scene ended up overlapping the
 * sign-in section below it instead of releasing cleanly. Native sticky
 * positioning has no separate measurement step to go stale, so it can't
 * hit that failure mode.
 */
export default function BenchyScrollScene() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: wrapRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        onUpdate: (self) => {
          progressRef.current = self.progress;
          const hopP = THREE.MathUtils.clamp((self.progress - BUILD_END) / (1 - BUILD_END), 0, 1);
          stickyRef.current?.style.setProperty("--hop-progress", String(hopP));
          const nextStage = Math.min(STAGES.length - 1, Math.floor(self.progress * STAGES.length));
          setStage((prev) => (prev === nextStage ? prev : nextStage));
        },
      });

      // Defensive: fonts/async chunks loading after initial measurement can
      // shift layout enough to make the cached start/end stale — one
      // refresh once everything's settled keeps this section (and every
      // other ScrollTrigger on the page) measuring against final layout.
      window.addEventListener("load", () => trigger.refresh());
    }, wrapRef);

    return () => ctx.revert();
  }, []);

  const current = STAGES[stage];

  return (
    <div ref={wrapRef} className="relative" style={{ height: "400vh" }}>
      <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden">
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
            <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#a855f7" />
            <Suspense fallback={null}>
              <ScrollBenchy progressRef={progressRef} />
              <PrinterRig progressRef={progressRef} />
            </Suspense>
            <BuildPlate />
          </Canvas>
        </div>

        {/* Water/foam overlay for the finale — opacity driven by
            --hop-progress (0 to 1), set imperatively in onUpdate above so
            this never triggers a React re-render on scroll. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: "var(--hop-progress, 0)",
            background:
              "linear-gradient(180deg, transparent 0%, var(--water-mid) 55%, var(--water-deep) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{ opacity: "var(--hop-progress, 0)" }}
        >
          <svg viewBox="0 0 800 80" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M0 40 Q100 10 200 40 T400 40 T600 40 T800 40 V80 H0 Z"
              fill="var(--water-foam)"
              opacity="0.9"
            />
          </svg>
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
    </div>
  );
}
