/**
 * Minimal STL geometry parser used to estimate a model's weight from its
 * actual mesh volume, instead of trusting a manually typed number. Supports
 * both binary and ASCII STL (the two formats in the wild) with no external
 * dependency — pure ArrayBuffer parsing, so it runs the same in the browser
 * and in a Server Action.
 */

function signedTetraVolume(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  cx: number,
  cy: number,
  cz: number,
): number {
  return (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
}

function parseBinarySTL(view: DataView, triCount: number): number {
  let volume = 0;
  let offset = 84;
  for (let i = 0; i < triCount; i++) {
    offset += 12; // skip normal
    const ax = view.getFloat32(offset, true);
    const ay = view.getFloat32(offset + 4, true);
    const az = view.getFloat32(offset + 8, true);
    const bx = view.getFloat32(offset + 12, true);
    const by = view.getFloat32(offset + 16, true);
    const bz = view.getFloat32(offset + 20, true);
    const cx = view.getFloat32(offset + 24, true);
    const cy = view.getFloat32(offset + 28, true);
    const cz = view.getFloat32(offset + 32, true);
    volume += signedTetraVolume(ax, ay, az, bx, by, bz, cx, cy, cz);
    offset += 36 + 2; // 3 vertices + attribute byte count
  }
  return Math.abs(volume);
}

function parseAsciiSTL(text: string): number {
  const vertexRe = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;
  const coords: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = vertexRe.exec(text)) !== null) {
    coords.push(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
  }
  let volume = 0;
  for (let i = 0; i + 8 < coords.length; i += 9) {
    volume += signedTetraVolume(
      coords[i],
      coords[i + 1],
      coords[i + 2],
      coords[i + 3],
      coords[i + 4],
      coords[i + 5],
      coords[i + 6],
      coords[i + 7],
      coords[i + 8],
    );
  }
  return Math.abs(volume);
}

/**
 * Returns the mesh's solid volume in cm³, assuming STL's de facto
 * convention of millimeter units. Returns null if the buffer doesn't look
 * like a valid STL (e.g. empty file).
 */
export function parseSTLVolumeCm3(buffer: ArrayBuffer): number | null {
  if (buffer.byteLength < 84) {
    return null;
  }

  const view = new DataView(buffer);
  const triCount = view.getUint32(80, true);
  const expectedBinarySize = 84 + triCount * 50;

  const volumeMm3 =
    expectedBinarySize === buffer.byteLength
      ? parseBinarySTL(view, triCount)
      : parseAsciiSTL(new TextDecoder().decode(buffer));

  if (!Number.isFinite(volumeMm3) || volumeMm3 <= 0) {
    return null;
  }

  return volumeMm3 / 1000; // mm³ -> cm³
}
