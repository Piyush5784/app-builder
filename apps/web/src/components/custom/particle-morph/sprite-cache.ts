/**
 * Pre-rendered particle "glow" sprites, one per unique color. Drawing a
 * cached radial-gradient bitmap via `drawImage` at every particle's on-screen
 * size is dramatically cheaper than a real-time `filter: blur()` per DOM
 * node — it's what makes thousands of glowing particles on a single canvas
 * feasible at 60fps.
 */

const SPRITE_RESOLUTION = 64;

function renderSprite(color: string, glow: boolean): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_RESOLUTION;
  canvas.height = SPRITE_RESOLUTION;
  const ctx = canvas.getContext("2d")!;
  const c = SPRITE_RESOLUTION / 2;

  const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
  if (glow) {
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.35, color);
    gradient.addColorStop(1, "transparent");
  } else {
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.75, color);
    gradient.addColorStop(1, "transparent");
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SPRITE_RESOLUTION, SPRITE_RESOLUTION);
  return canvas;
}

const cache = new Map<string, HTMLCanvasElement>();

export function getParticleSprite(
  color: string,
  glow: boolean,
): HTMLCanvasElement {
  const key = `${color}|${glow}`;
  let sprite = cache.get(key);
  if (!sprite) {
    sprite = renderSprite(color, glow);
    cache.set(key, sprite);
  }
  return sprite;
}
