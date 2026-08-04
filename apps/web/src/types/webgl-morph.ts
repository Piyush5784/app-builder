export type WebglShapeName =
  "sphere" | "cube" | "pyramid" | "torus" | "galaxy" | "wave";

export type WebglColorScheme = "fire" | "neon" | "nature" | "rainbow";

export type WebglMorphPosition = "background" | "fill";

export interface WebglMorphProps {
  /**
   * How the container positions itself. 'background': fixed to the full
   * viewport, behind everything (-z-10) — no ancestor between the page root
   * and this component may paint an opaque background, or it will cover the
   * fixed layer and hide it. 'fill': absolutely fills the nearest positioned
   * ancestor — the caller must make that ancestor `relative` (or similar)
   * and give it a real size. Default 'fill'.
   */
  position?: WebglMorphPosition;
  /** Extra className applied to the canvas's container div — for sizing/rounding, not positioning (use `position` for that). */
  className?: string;
  /** Number of particles in the morphing point cloud. Default 8000. */
  particleCount?: number;
  /** Radius/extent of the generated shapes. Default 14. */
  shapeSize?: number;
  /** Base hue palette the particles are shaded from. Default 'fire'. */
  colorScheme?: WebglColorScheme;
  /** Cycles through all shapes forever. Default true. */
  autoMorph?: boolean;
  /** Time between the end of one morph and the start of the next, in ms. Default 5000. */
  morphInterval?: number;
  /** Duration of one morph transition, in ms. Default 4000. */
  morphDuration?: number;
  /** Number of background starfield points. Default 6000. */
  starCount?: number;
  /** Bloom post-processing intensity. Default 1.1. */
  bloomStrength?: number;
  /** Camera distance from the origin. Default 28. */
  cameraDistance?: number;
  /** Renders the shape/color-scheme controls and enables click-to-morph. Default false. */
  showControls?: boolean;
}
