export type WebglShapeName =
  "sphere" | "cube" | "pyramid" | "torus" | "galaxy" | "wave";

export type WebglColorScheme = "fire" | "neon" | "nature" | "rainbow";

export type WebglMorphPosition = "background" | "fill";

export interface WebglMorphProps {
  position?: WebglMorphPosition;
  className?: string;
  particleCount?: number;
  shapeSize?: number;
  colorScheme?: WebglColorScheme;
  autoMorph?: boolean;
  morphInterval?: number;
  morphDuration?: number;
  starCount?: number;
  bloomStrength?: number;
  cameraDistance?: number;
  showControls?: boolean;
}
