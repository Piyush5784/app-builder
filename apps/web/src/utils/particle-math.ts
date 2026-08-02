export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Deterministic PRNG (mulberry32). Used so every particle's "random" characteristics
 * (color, size, phase, noise offset...) are stable across re-renders instead of
 * re-rolling on every render, which would make the field flicker/reshuffle.
 */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

// ---------------------------------------------------------------------------
// Lightweight seeded 3D gradient noise (classic-Perlin style). Self-contained,
// no dependency, deterministic across reloads. Used for the organic
// "never perfectly still" drift and for the blob shape's surface distortion.
// ---------------------------------------------------------------------------

const PERM: Uint8Array = (() => {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  const rng = mulberry32(1337);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  return perm;
})();

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function gradient(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/** Returns a value roughly in [-1, 1], smoothly varying with x, y, z. */
export function noise3D(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);
  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);
  const p = PERM;

  const a = p[X] + Y;
  const aa = p[a] + Z;
  const ab = p[a + 1] + Z;
  const b = p[X + 1] + Y;
  const ba = p[b] + Z;
  const bb = p[b + 1] + Z;

  return lerp(
    lerp(
      lerp(gradient(p[aa], xf, yf, zf), gradient(p[ba], xf - 1, yf, zf), u),
      lerp(
        gradient(p[ab], xf, yf - 1, zf),
        gradient(p[bb], xf - 1, yf - 1, zf),
        u,
      ),
      v,
    ),
    lerp(
      lerp(
        gradient(p[aa + 1], xf, yf, zf - 1),
        gradient(p[ba + 1], xf - 1, yf, zf - 1),
        u,
      ),
      lerp(
        gradient(p[ab + 1], xf, yf - 1, zf - 1),
        gradient(p[bb + 1], xf - 1, yf - 1, zf - 1),
        u,
      ),
      v,
    ),
    w,
  );
}
