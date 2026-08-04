import type { Point3D, ShapeName } from "@/types/particle-morph";
import { mulberry32, randRange, noise3D } from "@/utils/particle-math";

/** Golden angle, in radians — gives an even, non-clumping distribution over a sphere/disc. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Fibonacci sphere: evenly distributes `count` points over a sphere's surface. */
export function generateSphere(count: number, radius: number): Point3D[] {
  const pts: Point3D[] = [];
  const denom = Math.max(1, count - 1);
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / denom) * 2; // -1..1
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;
    pts.push({
      x: Math.cos(theta) * r * radius,
      y: y * radius,
      z: Math.sin(theta) * r * radius,
    });
  }
  return pts;
}

/** Vogel/sunflower disc packing, flattened onto the z≈0 plane. */
export function generateCircle(count: number, radius: number): Point3D[] {
  const pts: Point3D[] = [];
  for (let i = 0; i < count; i++) {
    const r = radius * Math.sqrt(i / count);
    const theta = GOLDEN_ANGLE * i;
    pts.push({
      x: Math.cos(theta) * r,
      y: Math.sin(theta) * r,
      z: (((i * 12.9898) % 1) - 0.5) * radius * 0.06,
    });
  }
  return pts;
}

/** Uniformly scatters points across the six faces of a cube. */
export function generateCube(
  count: number,
  radius: number,
  seed = 7,
): Point3D[] {
  const rng = mulberry32(seed);
  const pts: Point3D[] = [];
  const half = radius * 0.8;
  for (let i = 0; i < count; i++) {
    const face = Math.floor(rng() * 6);
    const u = randRange(rng, -1, 1) * half;
    const v = randRange(rng, -1, 1) * half;
    let x: number;
    let y: number;
    let z: number;
    switch (face) {
      case 0:
        x = half;
        y = u;
        z = v;
        break;
      case 1:
        x = -half;
        y = u;
        z = v;
        break;
      case 2:
        y = half;
        x = u;
        z = v;
        break;
      case 3:
        y = -half;
        x = u;
        z = v;
        break;
      case 4:
        z = half;
        x = u;
        y = v;
        break;
      default:
        z = -half;
        x = u;
        y = v;
        break;
    }
    pts.push({ x, y, z });
  }
  return pts;
}

/** Torus via major/minor radius parametric equations. */
export function generateTorus(count: number, radius: number): Point3D[] {
  const pts: Point3D[] = [];
  const R = radius * 0.65; // distance from torus center to tube center
  const r = radius * 0.28; // tube radius
  for (let i = 0; i < count; i++) {
    const theta = GOLDEN_ANGLE * i; // around the main ring
    const phi = i * 2.399963 * 1.9; // around the tube cross-section
    pts.push({
      x: (R + r * Math.cos(phi)) * Math.cos(theta),
      y: r * Math.sin(phi),
      z: (R + r * Math.cos(phi)) * Math.sin(theta),
    });
  }
  return pts;
}

/** Expanding helix from center outward. */
export function generateSpiral(count: number, radius: number): Point3D[] {
  const pts: Point3D[] = [];
  const turns = 5;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = t * turns * Math.PI * 2;
    const r = t * radius;
    pts.push({
      x: Math.cos(angle) * r,
      y: (t - 0.5) * radius * 1.6,
      z: Math.sin(angle) * r,
    });
  }
  return pts;
}

/** Sin/cos interference surface sampled on a grid. */
export function generateWave(count: number, radius: number): Point3D[] {
  const pts: Point3D[] = [];
  const gridSize = Math.ceil(Math.sqrt(count));
  const span = radius * 1.8;
  outer: for (let gx = 0; gx < gridSize; gx++) {
    for (let gz = 0; gz < gridSize; gz++) {
      if (pts.length >= count) break outer;
      const nx = gridSize > 1 ? gx / (gridSize - 1) - 0.5 : 0;
      const nz = gridSize > 1 ? gz / (gridSize - 1) - 0.5 : 0;
      const x = nx * span;
      const z = nz * span;
      const y =
        Math.sin(nx * Math.PI * 3) * Math.cos(nz * Math.PI * 3) * radius * 0.35;
      pts.push({ x, y, z });
    }
  }
  return pts;
}

/** Noise-perturbed sphere — an organic, non-uniform "liquid blob". */
export function generateBlob(
  count: number,
  radius: number,
  seed = 11,
): Point3D[] {
  const base = generateSphere(count, radius);
  return base.map((p) => {
    const nx = p.x / radius;
    const ny = p.y / radius;
    const nz = p.z / radius;
    const n = noise3D(nx * 1.8 + seed, ny * 1.8 + seed, nz * 1.8 + seed);
    const distortion = 1 + n * 0.45;
    return { x: p.x * distortion, y: p.y * distortion, z: p.z * distortion };
  });
}

/** Classic parametric heart curve, filled solid via randomized concentric layers. */
export function generateHeart(
  count: number,
  radius: number,
  seed = 3,
): Point3D[] {
  const rng = mulberry32(seed);
  const pts: Point3D[] = [];
  const scale = radius / 18;
  for (let i = 0; i < count; i++) {
    const layer = randRange(rng, 0.25, 1); // fills the interior, not just the outline
    const t = randRange(rng, 0, Math.PI * 2);
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    pts.push({
      x: x * scale * layer,
      y: -y * scale * layer,
      z: randRange(rng, -1, 1) * radius * 0.18,
    });
  }
  return pts;
}

/** Logarithmic spiral arms, with a small fraction scattered as free "field stars". */
export function generateGalaxy(
  count: number,
  radius: number,
  seed = 5,
): Point3D[] {
  const rng = mulberry32(seed);
  const pts: Point3D[] = [];
  const arms = 3;
  const b = 0.28; // spiral tightness
  for (let i = 0; i < count; i++) {
    const scattered = rng() < 0.12;
    const t = randRange(rng, 0, 3.2);
    const arm = i % arms;
    const armAngle = (arm / arms) * Math.PI * 2;
    const r = Math.min(radius, radius * 0.08 * Math.exp(b * t));
    const jitter = scattered
      ? randRange(rng, -radius * 0.5, radius * 0.5)
      : randRange(rng, -0.15, 0.15) * r;
    const angle = t * 2 + armAngle + jitter / (r + 1);
    pts.push({
      x: Math.cos(angle) * r + (scattered ? jitter * 0.3 : 0),
      y: randRange(rng, -1, 1) * radius * 0.06,
      z: Math.sin(angle) * r + (scattered ? jitter * 0.3 : 0),
    });
  }
  return pts;
}

/** Uniform random fill of the sphere's volume — used as a "chaos" shape. */
export function generateRandom(
  count: number,
  radius: number,
  seed = 99,
): Point3D[] {
  const rng = mulberry32(seed);
  const pts: Point3D[] = [];
  for (let i = 0; i < count; i++) {
    const u = rng();
    const v = rng();
    const w = rng();
    const r = radius * Math.cbrt(u); // cube root keeps the fill volumetrically uniform
    const theta = 2 * Math.PI * v;
    const phi = Math.acos(2 * w - 1);
    pts.push({
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
    });
  }
  return pts;
}

export function getShapePoints(
  shape: ShapeName,
  count: number,
  radius: number,
): Point3D[] {
  switch (shape) {
    case "sphere":
      return generateSphere(count, radius);
    case "circle":
      return generateCircle(count, radius);
    case "cube":
      return generateCube(count, radius);
    case "torus":
      return generateTorus(count, radius);
    case "spiral":
      return generateSpiral(count, radius);
    case "wave":
      return generateWave(count, radius);
    case "blob":
      return generateBlob(count, radius);
    case "heart":
      return generateHeart(count, radius);
    case "galaxy":
      return generateGalaxy(count, radius);
    case "random":
      return generateRandom(count, radius);
    default:
      return generateSphere(count, radius);
  }
}
