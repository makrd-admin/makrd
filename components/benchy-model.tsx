"use client";

import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as THREE from "three";

/**
 * Loads the real Benchy STL (public/models/benchy.stl — decimated from an
 * 11MB/225k-triangle source scan down to ~24k triangles/1.2MB, still fully
 * recognizable at the sizes this renders at) and normalizes it: centered
 * at the origin, scaled so its largest dimension is ~1.8 units (matching
 * the coordinate scale the rest of this app's Three.js scenes assume),
 * rotated from STL's Z-up convention to Three.js's Y-up. Cached by
 * useLoader, so every consumer shares one parsed/prepared geometry.
 */
export function useBenchyGeometry(): THREE.BufferGeometry {
  const raw = useLoader(STLLoader, "/models/benchy.stl");

  return useMemo(() => {
    const geo = raw.clone();
    geo.rotateX(-Math.PI / 2);
    geo.center();
    geo.computeBoundingBox();
    const size = new THREE.Vector3();
    geo.boundingBox!.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 1.8 / maxDim;
    geo.scale(scale, scale, scale);
    geo.computeVertexNormals();
    return geo;
  }, [raw]);
}
