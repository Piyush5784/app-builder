# ParticleMorph

A canvas-rendered morphing particle field for React 19, built with TailwindCSS.
Type-checked against `react@19` and `typescript@5.5` with zero errors.

## File layout

```
src/
  components/custom/particle-morph/
    particle-morph.tsx     # main component: field gen + rAF animation loop + canvas draw
    sprite-cache.ts          # pre-rendered per-color glow sprites (drawImage source)
    shape-generators.ts     # procedural math for every shape
    constants.ts             # defaults + autoMorph shape sequence
    example-hero.tsx        # example usage (wired into routes/index.tsx)
  types/
    particle-morph.ts       # ShapeName, ParticleMorphProps, Point3D
  utils/
    particle-math.ts        # lerp/easing/seeded RNG/gradient noise (generic, reusable)
    color-variants.ts       # base-color -> tonal palette generation (generic, reusable)
```

`particle-math.ts` and `color-variants.ts` live in the app-wide `utils/` folder
rather than colocated here because they're generic (no canvas/particle
concepts) and safe to reuse elsewhere. Everything else here is specific to
this component and stays colocated.

## Usage

```tsx
import { ParticleMorph } from "@/components/custom/particle-morph/particle-morph";

<ParticleMorph
  width={700}
  height={700}
  particleCount={900}
  particleSize={2}
  particleColor="pink"
  shape="sphere"
  autoMorph
  mouseRepel
  rotation
/>
```

See `example-hero.tsx` in this folder for a full hero-section example.

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `width` / `height` | `number` | `700` | container size in px |
| `particleCount` | `number` | `900` | thousands are fine — see Performance approach below |
| `particleSize` | `number` | `2` | base diameter; actual size varies ±per particle |
| `shape` | `ShapeName` | `'sphere'` | ignored once `autoMorph` starts cycling |
| `autoMorph` | `boolean` | `false` | cycles through `SHAPE_SEQUENCE` forever |
| `morphDuration` | `number` | `4000` | ms per full morph+hold cycle |
| `background` | `string` | `'#000000'` | any CSS background value, shows through the transparent canvas |
| `particleColor` | `string` | `'pink'` | any CSS color, or `'random'` for a random hue; particles get tonal variants of this one hue, never unrelated colors |
| `glow` | `boolean` | `true` | soft radial-gradient sprite + additive (`lighter`) blending |
| `mouseRepel` / `mouseAttract` | `boolean` | `false` | mutually usable; repel takes precedence if both true |
| `rotation` / `rotationSpeed` | `boolean` / `number` | `true` / `0.15` | slow orbit of the whole cloud |
| `pulse` | `boolean` | `true` | global breathing scale |
| `hoverEffect` | `boolean` | `true` | particles near the cursor brighten/grow |

`ShapeName`: `'sphere' | 'circle' | 'cube' | 'torus' | 'spiral' | 'wave' | 'blob' | 'heart' | 'galaxy' | 'random'`

## Performance approach

- **A single `<canvas>`, not one DOM node per particle.** Every particle is a
  `ctx.drawImage()` call inside one `requestAnimationFrame` loop, so the cost
  is one paint surface regardless of particle count — no per-node style
  recalc/layout/compositing, which is what makes thousands of particles
  (5000+) run smoothly where a DOM-per-particle approach falls over.
- **Pre-rendered glow sprites, not per-particle blur.** `sprite-cache.ts` bakes
  one radial-gradient bitmap per unique color (via `useMemo`, built once).
  The rAF loop just blits that bitmap at each particle's current size —
  dramatically cheaper than a real-time `filter: blur()` per element, which
  is what actually made an earlier DOM-based version slow at high counts.
- **Additive blending (`globalCompositeOperation = 'lighter'`).** Produces the
  bloom look where overlapping particles brighten, and — usefully — makes
  draw order irrelevant, so there's no need to depth-sort particles by `z`
  before drawing.
- **Struct-of-arrays, not array-of-objects.** Per-particle state (size,
  brightness, orbit params, position buffers) is stored as `Float32Array`s
  indexed in a tight `for` loop, not an array of `{ ... }` objects. This
  avoids allocating thousands of small objects per frame and keeps the hot
  loop monomorphic for the JIT.
- **No React state per frame.** Nothing here is React state; the loop writes
  straight to the canvas bitmap, completely bypassing React's render/commit
  cycle.

## How colors work

`particleColor` takes a single base color (or `'random'`), not a palette
array. `utils/color-variants.ts` resolves that base color to a hue and
generates a small set of tonal variants — a pale, nearly-white tint through
to a deep, fully-saturated accent of the *same* hue — and each particle is
seeded with one of those variants. This keeps the field reading as one
coherent color, never a scatter of unrelated hues.

## How the morph works

On every shape change, `setTargetShape` snapshots the current live position of
every particle as the new `start`, computes the new shape's points as
`target`, and resets a timer. Each frame, an eased `t` (cubic in/out) blends
`start → target`. Organic drift (gradient noise), a slow personal orbit, and
global rotation/breathing are all added *on top* of that interpolated base
position before projecting to 2D — so particles are still alive and wandering
even while "settled" into a shape, and there's never a hard teleport between
shapes.

`autoMorph` just repeatedly calls `setTargetShape` with the next entry in
`SHAPE_SEQUENCE` once `transitionDuration + holdDuration` has elapsed.

## Adding a new procedural shape

1. In `shape-generators.ts`, write `generateYourShape(count, radius): Point3D[]`
   returning `count` points in local space (roughly `[-radius, radius]`).
2. Add `'yourShape'` to the `ShapeName` union in `@/types/particle-morph`.
3. Add a `case 'yourShape': return generateYourShape(count, radius);` to
   `getShapePoints`.
4. Optionally add it to `SHAPE_SEQUENCE` in `constants.ts` if it should appear
   in the `autoMorph` cycle.

No other file needs to change — the animation loop, projection, and
interaction code are shape-agnostic; they only ever consume `Point3D[]`.

## Tailwind classes used

Only structural utilities are used (all visual styling — color, glow — is
drawn to the canvas at runtime, not expressed as CSS):
`relative`, `absolute`, `overflow-hidden`, `inset-0`.
