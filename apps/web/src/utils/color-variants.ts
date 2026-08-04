import { mulberry32 } from "@/utils/particle-math";

interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** Normalizes any valid CSS color (name, hex, rgb, hsl...) to RGB via the browser's own parser. */
function cssColorToRgb(color: string): [number, number, number] {
  const probe = document.createElement("div");
  probe.style.color = color;
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const match = computed.match(/[\d.]+/g);
  if (!match) return [255, 255, 255];
  const [r, g, b] = match.map(Number);
  return [r, g, b];
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return { h: h * 60, s: s * 100, l: l * 100 };
}

/**
 * Generates `count` tonal variants of a single base color — a pale, nearly
 * white tint through to a deep, fully-saturated accent of the same hue —
 * instead of assigning particles unrelated colors. Deterministic per base
 * hue so the palette doesn't reshuffle across re-renders.
 */
export function generateColorVariants(
  baseColor: string,
  count: number,
): string[] {
  const { h } = rgbToHsl(...cssColorToRgb(baseColor));
  const rng = mulberry32(Math.round(h * 1000) + count);
  const variants: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const hueJitter = (rng() - 0.5) * 10;
    const s = 25 + t * 75; // pale/desaturated -> fully saturated
    const l = 90 - t * 50; // light tint -> deep accent
    variants.push(`hsl(${(h + hueJitter + 360) % 360}, ${s}%, ${l}%)`);
  }
  return variants;
}
