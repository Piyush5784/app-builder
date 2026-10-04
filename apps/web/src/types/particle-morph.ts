export type ShapeName =
  | "sphere"
  | "circle"
  | "cube"
  | "torus"
  | "spiral"
  | "wave"
  | "blob"
  | "heart"
  | "galaxy"
  | "random";

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ParticleMorphProps {
  width?: number;
  height?: number;
  particleCount?: number;
  particleSize?: number;
  shape?: ShapeName;
  autoMorph?: boolean;
  morphDuration?: number;
  background?: string;
  particleColor?: string;
  glow?: boolean;
  className?: string;
  mouseRepel?: boolean;
  mouseAttract?: boolean;
  rotation?: boolean;
  rotationSpeed?: number;
  pulse?: boolean;
  hoverEffect?: boolean;
}
