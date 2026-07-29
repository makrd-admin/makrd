"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

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

function FresnelGlow({
  geometry,
  color = "#4ade80",
}: {
  geometry: THREE.BufferGeometry;
  color?: string;
}) {
  const uniforms = useMemo(
    () => ({
      glowColor: { value: new THREE.Color(color) },
      power: { value: 2.2 },
    }),
    [color],
  );

  return (
    <mesh geometry={geometry} scale={1.045}>
      <shaderMaterial
        vertexShader={FRESNEL_VERTEX}
        fragmentShader={FRESNEL_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

const GROW_SECONDS = 3.2;
const HOLD_SECONDS = 1.4;
const CYCLE_SECONDS = GROW_SECONDS + HOLD_SECONDS;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function useHullShape() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.0, 0);
    shape.quadraticCurveTo(-1.08, 0, -1.08, 0.12);
    shape.lineTo(-1.08, 0.3);
    shape.quadraticCurveTo(-1.08, 0.4, -0.92, 0.42);
    shape.lineTo(-0.4, 0.44);
    shape.lineTo(-0.4, 0.62);
    shape.lineTo(0.4, 0.62);
    shape.lineTo(0.4, 0.44);
    shape.lineTo(0.92, 0.42);
    shape.quadraticCurveTo(1.08, 0.4, 1.1, 0.3);
    shape.lineTo(1.1, 0.12);
    shape.quadraticCurveTo(1.1, 0, 1.0, 0);
    shape.lineTo(-1.0, 0);
    return shape;
  }, []);
}

function Hull() {
  const shape = useHullShape();
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.55,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 24,
    });
    geo.translate(0, -0.3, -0.275);
    return geo;
  }, [shape]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime % CYCLE_SECONDS;
    const progress = Math.min(t / GROW_SECONDS, 1);
    groupRef.current.scale.y = Math.max(0.02, easeOutCubic(progress));
  });

  return (
    <group ref={groupRef} position={[0, -0.05, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial color="#16a34a" roughness={0.35} metalness={0.15} clearcoat={0.5} />
      </mesh>
      <FresnelGlow geometry={geometry} />

      {/* funnel */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.22, 16]} />
        <meshPhysicalMaterial color="#bef264" roughness={0.3} metalness={0.2} clearcoat={0.5} />
      </mesh>

      {/* face, on the cabin front */}
      <mesh position={[-0.15, 0.34, 0.29]}>
        <sphereGeometry args={[0.07, 24, 24]} />
        <meshStandardMaterial color="white" roughness={0.15} />
      </mesh>
      <mesh position={[0.15, 0.34, 0.29]}>
        <sphereGeometry args={[0.07, 24, 24]} />
        <meshStandardMaterial color="white" roughness={0.15} />
      </mesh>
      <mesh position={[-0.13, 0.34, 0.35]}>
        <sphereGeometry args={[0.032, 16, 16]} />
        <meshStandardMaterial color="#171717" roughness={0.4} />
      </mesh>
      <mesh position={[0.17, 0.34, 0.35]}>
        <sphereGeometry args={[0.032, 16, 16]} />
        <meshStandardMaterial color="#171717" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.18, 0.32]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.11, 0.014, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#171717" roughness={0.4} />
      </mesh>
    </group>
  );
}

function BuildPlate() {
  return (
    <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[1.9, 48]} />
      <meshStandardMaterial color="#111827" roughness={0.6} metalness={0.4} />
    </mesh>
  );
}

/**
 * Skipper, rendered as an actual 3D model (procedural geometry — no external
 * asset file) with PBR materials and real lighting, instead of the flat SVG
 * approximation used elsewhere. Client-only: WebGL doesn't exist server-side,
 * so this must always be loaded via next/dynamic with ssr:false.
 */
export default function Skipper3D({ size = 320 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas shadows camera={{ position: [2.4, 1.6, 2.8], fov: 38 }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 2]} intensity={1.4} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#22c55e" />
        <pointLight position={[0, 1.5, 2]} intensity={0.3} color="#bef264" />
        <Hull />
        <BuildPlate />
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
