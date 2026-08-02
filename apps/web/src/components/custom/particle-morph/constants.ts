import type { ShapeName } from "@/types/particle-morph";

export const DEFAULT_WIDTH = 700;
export const DEFAULT_HEIGHT = 700;
export const DEFAULT_PARTICLE_COUNT = 900;
export const DEFAULT_PARTICLE_SIZE = 2;
export const DEFAULT_MORPH_DURATION = 4000;
export const DEFAULT_BACKGROUND = "#000000";

/** Base hue particles are shaded from — any CSS color, or 'random' for a random hue per mount. */
export const DEFAULT_COLOR = "pink";

/** Order autoMorph cycles through. Deliberately alternates "tight" and "loose" shapes. */
export const SHAPE_SEQUENCE: ShapeName[] = [
  "sphere",
  // "galaxy",
  // "torus",
  "blob",
  // "random"
  // "heart",
  // "spiral",
  "cube",
  // "wave",
  // "circle",
];

/** Faux-perspective focal length used to project 3D points onto the 2D DOM plane. */
export const FOCAL_LENGTH = 620;
