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

/** A point in the component's local 3D space, in pixel-scale units centered at the origin. */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ParticleMorphProps {
  /** Container width in pixels. Default 700. */
  width?: number;
  /** Container height in pixels. Default 700. */
  height?: number;
  /** Number of particles to render. 500-1500 recommended. Default 900. */
  particleCount?: number;
  /** Base particle diameter in pixels (actual size varies per-particle around this). Default 2. */
  particleSize?: number;
  /** Target procedural shape. Default 'sphere'. */
  shape?: ShapeName;
  /** When true, automatically cycles through shapes forever, ignoring manual `shape` changes. Default false. */
  autoMorph?: boolean;
  /** Duration of one full morph transition, in ms. Also paces the autoMorph cycle. Default 4000. */
  morphDuration?: number;
  /** CSS background for the container. Default '#000000'. */
  background?: string;
  /**
   * Base color the whole field is shaded from — any CSS color ('pink',
   * '#f472b6', 'hsl(330, 80%, 60%)'...) or the literal string 'random' to
   * pick a random hue once per mount. Particles are automatically assigned
   * tonal variants (pale tint -> deep saturated accent) of this one hue,
   * never unrelated colors. Default 'pink'.
   */
  particleColor?: string;
  /** Enable soft glow (pre-rendered radial-gradient sprite, additive blending). Default true. */
  glow?: boolean;
  /** Extra className applied to the outer container. */
  className?: string;
  /** Particles are pushed away from the cursor. Default false. */
  mouseRepel?: boolean;
  /** Particles are pulled toward the cursor. Default false. */
  mouseAttract?: boolean;
  /** Slowly rotates the whole point cloud around its vertical axis. Default true. */
  rotation?: boolean;
  /** Rotation speed multiplier. Default 0.15. */
  rotationSpeed?: number;
  /** Adds a slow global breathing scale pulse. Default true. */
  pulse?: boolean;
  /** Particles near the cursor brighten and grow slightly. Default true. */
  hoverEffect?: boolean;
}
