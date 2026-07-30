"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useBenchyGeometry } from "./benchy-model";
import LogoMark from "./logo-mark";

gsap.registerPlugin(ScrollTrigger);

// Camera choreography checkpoints, as fractions of total scroll progress.
const APPEAR_END = 0.08; // the benchy scales in, already afloat
const ORBIT_END = 0.4; // camera orbits close around it as it drifts
const FRONT_AT = 0.7; // camera settles to a low, front-on view, water under the hull
// FRONT_AT -> 1: camera pulls back and up into a wide ocean-scenery shot

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

const WATER_Y = -0.34;
const WATER_DEEP = new THREE.Color("#0369a1");
const WATER_FOAM = new THREE.Color("#f0f9ff");

/** A large rippling water plane the benchy sails across for the whole
 * scene (not just a finale overlay). Segments are displaced with a couple
 * of overlapping sine waves each frame — cheap, no shader — instead of a
 * flat static plane. Wave peaks are tinted toward white via per-vertex
 * colors (computed from the same displacement each frame) so the surface
 * reads as real water catching whitecaps, not a flat blue sheet. */
function WaterSurface() {
  const geomRef = useRef<THREE.PlaneGeometry>(null);
  const basePositions = useRef<Float32Array | null>(null);
  const tmpColor = useRef(new THREE.Color());

  useFrame(({ clock }) => {
    const geom = geomRef.current;
    if (!geom) return;
    if (!basePositions.current) {
      basePositions.current = (geom.attributes.position.array as Float32Array).slice();
      const colors = new Float32Array(geom.attributes.position.count * 3);
      geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    }
    const base = basePositions.current;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const color = geom.attributes.color as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const wave = Math.sin(x * 0.5 + t) * 0.05 + Math.sin(y * 0.6 - t * 0.8) * 0.04;
      pos.setZ(i, wave);
      // Foam at wave crests only (top ~25% of the displacement range).
      const foamAmount = THREE.MathUtils.smoothstep(wave, 0.045, 0.09);
      tmpColor.current.copy(WATER_DEEP).lerp(WATER_FOAM, foamAmount);
      color.setXYZ(i, tmpColor.current.r, tmpColor.current.g, tmpColor.current.b);
    }
    pos.needsUpdate = true;
    color.needsUpdate = true;
  });

  return (
    <mesh position={[0, WATER_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry ref={geomRef} args={[36, 36, 60, 60]} />
      <meshPhysicalMaterial
        vertexColors
        roughness={0.2}
        metalness={0.05}
        clearcoat={0.7}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}

/** A soft foam ring that tracks the boat's position at the waterline,
 * standing in for a bow wave / wake without simulating real fluid
 * displacement — reads as "waves breaking against the hull" from a
 * distance, which is all this scale of scene needs. */
function HullWake({ boatPosition }: { boatPosition: React.RefObject<THREE.Vector3> }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const p = boatPosition.current;
    ringRef.current.position.set(p.x, WATER_Y + 0.015, p.z);
    const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.08;
    ringRef.current.scale.set(pulse, pulse, 1);
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.32, 0.62, 32]} />
      <meshBasicMaterial color="#f0f9ff" transparent opacity={0.55} depthWrite={false} />
    </mesh>
  );
}

/**
 * The benchy itself: appears already afloat (no printer, no build-up),
 * drifts slowly across the water as scroll advances, and bobs/sways in
 * place once fully appeared. The camera choreography lives in this same
 * component (rather than reading the group's transform back out) so both
 * can share one `target` position each frame without an extra render.
 */
function ScrollBenchy({
  progressRef,
  boatPosition,
}: {
  progressRef: React.RefObject<number>;
  boatPosition: React.RefObject<THREE.Vector3>;
}) {
  const geometry = useBenchyGeometry();
  const groupRef = useRef<THREE.Group>(null);
  const target = boatPosition;

  useFrame(({ camera, clock }) => {
    const p = progressRef.current;
    const appearP = THREE.MathUtils.clamp(p / APPEAR_END, 0, 1);
    const t = clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.scale.setScalar(Math.max(0.06, appearP));
      const driftZ = -p * 1.6;
      const driftX = Math.sin(p * Math.PI * 1.3) * 0.35;
      const bob = Math.sin(t * 1.6) * 0.045 * appearP;
      groupRef.current.position.set(driftX, bob, driftZ);
      groupRef.current.rotation.z = Math.sin(t * 0.9) * 0.02 * appearP;
      groupRef.current.rotation.y = Math.sin(p * Math.PI * 1.3) * 0.18;
      target.current.copy(groupRef.current.position);
    }

    if (p <= ORBIT_END) {
      // stage 1: orbit close around the benchy as it settles onto the water
      const orbitP = THREE.MathUtils.clamp(p / ORBIT_END, 0, 1);
      const angle = orbitP * Math.PI * 1.6;
      const radius = 3.0;
      const height = 0.9 + Math.sin(orbitP * Math.PI) * 0.55;
      camera.position.set(
        target.current.x + Math.sin(angle) * radius,
        target.current.y + height,
        target.current.z + Math.cos(angle) * radius,
      );
    } else if (p <= FRONT_AT) {
      // stage 2: converge to a low, front-on view — water clearly under
      // the hull, benchy still large/close
      const t2 = THREE.MathUtils.clamp((p - ORBIT_END) / (FRONT_AT - ORBIT_END), 0, 1);
      const angle = THREE.MathUtils.lerp(Math.PI * 1.6, Math.PI * 2, t2);
      const radius = THREE.MathUtils.lerp(3.0, 2.2, t2);
      const height = THREE.MathUtils.lerp(0.9, 0.3, t2);
      camera.position.set(
        target.current.x + Math.sin(angle) * radius,
        target.current.y + height,
        target.current.z + Math.cos(angle) * radius,
      );
    } else {
      // stage 3: pull back and up into a wide ocean-scenery shot
      const t3 = THREE.MathUtils.clamp((p - FRONT_AT) / (1 - FRONT_AT), 0, 1);
      const radius = THREE.MathUtils.lerp(2.2, 10, t3);
      const height = THREE.MathUtils.lerp(0.3, 5.2, t3);
      camera.position.set(target.current.x, target.current.y + height, target.current.z + radius);
    }
    camera.lookAt(target.current.x, target.current.y, target.current.z);
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f5f5f0" roughness={0.45} metalness={0.05} clearcoat={0.5} />
      </mesh>
    </group>
  );
}

/**
 * A scroll-scrubbed scene: the real Benchy model sails across a rippling
 * water surface for the entire section (no printer/build-up — it's simply
 * afloat from the start). The camera orbits close around it, settles into
 * a low front-on view with the water clearly under the hull, then pulls
 * back and up into a wide "boat on the ocean" establishing shot as the
 * section hands off to the water/sign-in content below. Text panels swap
 * alongside it at fixed progress checkpoints, independent of the camera
 * choreography.
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
  const boatPositionRef = useRef(new THREE.Vector3());
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
          // Fades in the DOM water/foam overlay only in the last stretch
          // of scroll, bridging the 3D scene's own water into the CSS
          // WaterFlow section immediately below it.
          const FINALE_START = 0.88;
          const finaleP = THREE.MathUtils.clamp(
            (self.progress - FINALE_START) / (1 - FINALE_START),
            0,
            1,
          );
          stickyRef.current?.style.setProperty("--finale-progress", String(finaleP));
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
            <ambientLight intensity={0.65} />
            <directionalLight position={[3, 5, 2]} intensity={1.3} castShadow />
            <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#7dd3fc" />
            <Suspense fallback={null}>
              <ScrollBenchy progressRef={progressRef} boatPosition={boatPositionRef} />
              <WaterSurface />
              <HullWake boatPosition={boatPositionRef} />
            </Suspense>
          </Canvas>
        </div>

        {/* Water/foam overlay bridging into the WaterFlow section below —
            opacity driven by --finale-progress, set imperatively in
            onUpdate above so this never triggers a React re-render on
            scroll. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: "var(--finale-progress, 0)",
            background:
              "linear-gradient(180deg, transparent 0%, var(--water-mid) 55%, var(--water-deep) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{ opacity: "var(--finale-progress, 0)" }}
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
