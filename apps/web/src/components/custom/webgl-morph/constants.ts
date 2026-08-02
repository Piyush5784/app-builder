import type { WebglColorScheme } from "@/types/webgl-morph";

export const DEFAULT_PARTICLE_COUNT = 8000;
export const DEFAULT_SHAPE_SIZE = 14;
export const DEFAULT_STAR_COUNT = 6000;
export const DEFAULT_MORPH_DURATION = 4000;
export const DEFAULT_MORPH_INTERVAL = 5000;
export const DEFAULT_BLOOM_STRENGTH = 1.1;
export const DEFAULT_CAMERA_DISTANCE = 28;

export const IDLE_FLOW_STRENGTH = 0.25;
export const IDLE_FLOW_SPEED = 0.08;
export const IDLE_ROTATION_SPEED = 0.05;
export const SWIRL_FACTOR = 4.0;
export const NOISE_FREQUENCY = 0.1;
export const NOISE_TIME_SCALE = 0.04;
export const NOISE_MAX_STRENGTH = 2.8;
export const MORPH_SIZE_FACTOR = 0.5;
export const MORPH_BRIGHTNESS_FACTOR = 0.6;
export const PARTICLE_SIZE_RANGE: [number, number] = [0.08, 0.25];
export const BLOOM_RADIUS = 0.5;
export const BLOOM_THRESHOLD = 0.05;

export const COLOR_SCHEMES: Record<
  WebglColorScheme,
  { startHue: number; endHue: number; saturation: number; lightness: number }
> = {
  fire: { startHue: 0, endHue: 45, saturation: 0.95, lightness: 0.6 },
  neon: { startHue: 300, endHue: 180, saturation: 1.0, lightness: 0.65 },
  nature: { startHue: 90, endHue: 160, saturation: 0.85, lightness: 0.55 },
  rainbow: { startHue: 0, endHue: 360, saturation: 0.9, lightness: 0.6 },
};

export const COLOR_SCHEME_NAMES: WebglColorScheme[] = [
  "fire",
  "neon",
  "nature",
  "rainbow",
];

export const COLOR_SCHEME_SWATCHES: Record<WebglColorScheme, string> = {
  fire: "linear-gradient(to bottom right, #ff4500, #ffcc00)",
  neon: "linear-gradient(to bottom right, #ff00ff, #00ffff)",
  nature: "linear-gradient(to bottom right, #00ff00, #66ffcc)",
  rainbow:
    "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)",
};
