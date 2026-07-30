"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useBenchyGeometry } from "./benchy-model";

// Fresnel rim-light: a thin glowing shell around the hull, brightest at
// grazing angles (where the surface normal points away from the camera).
// Standard fresnel-glow GLSL pattern — the one bit of hand-written shader
// code in this app, kept small and isolated on its own shell mesh so a
// mistake here can't break the base hull's visibility.
const FRESNEL_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRESNEL_FRAGMENT = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  uniform vec3 glowColor;
  uniform float power;
  void main() {
    float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0), power);
    gl_FragColor = vec4(glowColor, fresnel * 0.85);
  }
`;

function FresnelGlow({ geometry }: { geometry: THREE.BufferGeometry }) {
  return (
    <mesh geometry={geometry} scale={1.03}>
      <shaderMaterial
        vertexShader={FRESNEL_VERTEX}
        fragmentShader={FRESNEL_FRAGMENT}
        uniforms={{
          glowColor: { value: new THREE.Color("#4ade80") },
          power: { value: 2.2 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

/**
 * The hull, already afloat and gently bobbing/swaying in place — no
 * build-up-from-nothing animation and no build plate underneath. Matches
 * how the landing hero's Benchy behaves (components/benchy-scroll-scene.tsx):
 * that scene dropped the "being 3D printed" framing entirely per explicit
 * feedback, so this shared model (used here and by the persistent mascot)
 * follows the same "just a real boat, already there" treatment instead of
 * its earlier print-and-grow loop.
 */
function Hull() {
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useBenchyGeometry();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 1.4) * 0.05;
    groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.03;
    groupRef.current.rotation.x = Math.sin(t * 0.6) * 0.015;
  });

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f5f5f0" roughness={0.45} metalness={0.05} clearcoat={0.5} />
      </mesh>
      <FresnelGlow geometry={geometry} />
    </group>
  );
}

/**
 * Skipper, rendered as the real Benchy 3D model (public/models/benchy.stl,
 * decimated from a real scan — see components/benchy-model.tsx) with PBR
 * materials, a fresnel rim glow, and real lighting. Client-only: WebGL
 * doesn't exist server-side, so this must always be loaded via next/dynamic
 * with ssr:false.
 */
export default function Skipper3D({ size = 320 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas shadows camera={{ position: [2.4, 1.6, 2.8], fov: 38 }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 2]} intensity={1.4} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#22c55e" />
        <pointLight position={[0, 1.5, 2]} intensity={0.3} color="#bef264" />
        <Suspense fallback={null}>
          <Hull />
        </Suspense>
        <OrbitControls
          autoRotate
          autoRotateSpeed={2.2}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
