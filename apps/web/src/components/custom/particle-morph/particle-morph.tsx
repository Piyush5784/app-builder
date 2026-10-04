import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getParticleSprite } from "@/components/custom/particle-morph/sprite-cache";
import { getShapePoints } from "@/components/custom/particle-morph/shape-generators";
import {
  DEFAULT_BACKGROUND,
  DEFAULT_COLOR,
  DEFAULT_HEIGHT,
  DEFAULT_MORPH_DURATION,
  DEFAULT_PARTICLE_COUNT,
  DEFAULT_PARTICLE_SIZE,
  DEFAULT_WIDTH,
  FOCAL_LENGTH,
  SHAPE_SEQUENCE,
} from "@/components/custom/particle-morph/constants";
import { generateColorVariants } from "@/utils/color-variants";
import {
  clamp,
  easeInOutCubic,
  lerp,
  mulberry32,
  noise3D,
  randRange,
} from "@/utils/particle-math";
import type {
  ParticleMorphProps,
  Point3D,
  ShapeName,
} from "@/types/particle-morph";

interface PositionBuffer {
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
}

const COLOR_VARIANT_COUNT = 8;

function pointsToBuffer(points: Point3D[]): PositionBuffer {
  const n = points.length;
  const buf: PositionBuffer = {
    x: new Float32Array(n),
    y: new Float32Array(n),
    z: new Float32Array(n),
  };
  for (let i = 0; i < n; i++) {
    buf.x[i] = points[i].x;
    buf.y[i] = points[i].y;
    buf.z[i] = points[i].z;
  }
  return buf;
}

export function ParticleMorph({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  particleCount = DEFAULT_PARTICLE_COUNT,
  particleSize = DEFAULT_PARTICLE_SIZE,
  shape = "sphere",
  autoMorph = false,
  morphDuration = DEFAULT_MORPH_DURATION,
  background = DEFAULT_BACKGROUND,
  particleColor = DEFAULT_COLOR,
  glow = true,
  className = "",
  mouseRepel = false,
  mouseAttract = false,
  rotation = true,
  rotationSpeed = 0.15,
  pulse = true,
  hoverEffect = true,
}: ParticleMorphProps) {
  const radius = Math.min(width, height) * 0.32;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [randomHue] = useState(() => Math.floor(Math.random() * 360));

  const field = useMemo(() => {
    const n = particleCount;
    const baseSize = new Float32Array(n);
    const brightness = new Float32Array(n);
    const noiseOffset = new Float32Array(n);
    const orbitPhase = new Float32Array(n);
    const orbitSpeed = new Float32Array(n);
    const orbitRadius = new Float32Array(n);
    const seed = new Float32Array(n);
    const sprite: HTMLCanvasElement[] = new Array(n);

    const baseColor =
      particleColor.toLowerCase() === "random"
        ? `hsl(${randomHue}, 75%, 55%)`
        : particleColor;
    const variants = generateColorVariants(baseColor, COLOR_VARIANT_COUNT);

    for (let i = 0; i < n; i++) {
      const rng = mulberry32(i * 9973 + 17);
      seed[i] = rng() * 1000;
      const color = variants[Math.floor(rng() * variants.length)];
      sprite[i] = getParticleSprite(color, glow);
      baseSize[i] = particleSize * randRange(rng, 0.55, 1.6);
      brightness[i] = randRange(rng, 0.55, 1);
      noiseOffset[i] = randRange(rng, 0, 1000);
      orbitPhase[i] = randRange(rng, 0, Math.PI * 2);
      orbitSpeed[i] = randRange(rng, 0.15, 0.4);
      orbitRadius[i] = randRange(rng, 1, 6);
    }

    return {
      n,
      baseSize,
      brightness,
      noiseOffset,
      orbitPhase,
      orbitSpeed,
      orbitRadius,
      seed,
      sprite,
    };
  }, [particleCount, particleSize, particleColor, glow, randomHue]);

  const currentPos = useRef<PositionBuffer>({
    x: new Float32Array(0),
    y: new Float32Array(0),
    z: new Float32Array(0),
  });
  const startPos = useRef<PositionBuffer>({
    x: new Float32Array(0),
    y: new Float32Array(0),
    z: new Float32Array(0),
  });
  const targetPos = useRef<PositionBuffer>({
    x: new Float32Array(0),
    y: new Float32Array(0),
    z: new Float32Array(0),
  });
  const morphStartRef = useRef(0);
  const shapeSequenceIndexRef = useRef(0);
  const currentShapeRef = useRef<ShapeName>(shape);
  const lastAutoMorphRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const rafRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef(0);

  const setTargetShape = useCallback(
    (nextShape: ShapeName, now: number) => {
      const nextTarget = pointsToBuffer(
        getShapePoints(nextShape, particleCount, radius),
      );
      const cur = currentPos.current;
      startPos.current = cur.x.length
        ? { x: cur.x.slice(), y: cur.y.slice(), z: cur.z.slice() }
        : {
            x: nextTarget.x.slice(),
            y: nextTarget.y.slice(),
            z: nextTarget.z.slice(),
          };
      targetPos.current = nextTarget;
      morphStartRef.current = now;
      currentShapeRef.current = nextShape;
    },
    [particleCount, radius],
  );

  useEffect(() => {
    const now = performance.now();
    const initial = pointsToBuffer(
      getShapePoints(shape, particleCount, radius),
    );
    currentPos.current = {
      x: initial.x.slice(),
      y: initial.y.slice(),
      z: initial.z.slice(),
    };
    startPos.current = initial;
    targetPos.current = {
      x: initial.x.slice(),
      y: initial.y.slice(),
      z: initial.z.slice(),
    };
    morphStartRef.current = now - morphDuration;
    currentShapeRef.current = shape;
    shapeSequenceIndexRef.current = Math.max(0, SHAPE_SEQUENCE.indexOf(shape));
    lastAutoMorphRef.current = now;
    // Only re-seed the field on structural changes, not on every prop tweak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particleCount, radius]);

  useEffect(() => {
    if (autoMorph) return;
    if (currentShapeRef.current === shape) return;
    setTargetShape(shape, performance.now());
  }, [shape, autoMorph, setTargetShape]);

  const handlePointerMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left - width / 2;
      mouseRef.current.y = e.clientY - rect.top - height / 2;
      mouseRef.current.active = true;
    },
    [width, height],
  );
  const handlePointerLeave = useCallback(() => {
    mouseRef.current.active = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    ctx?.scale(dpr, dpr);
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    startTimeRef.current = performance.now();
    const transitionDuration = morphDuration * 0.55;
    const holdDuration = morphDuration * 0.45;
    const centerX = width / 2;
    const centerY = height / 2;

    const tick = () => {
      const now = performance.now();
      const t = now - startTimeRef.current;

      if (
        autoMorph &&
        now - lastAutoMorphRef.current > transitionDuration + holdDuration
      ) {
        shapeSequenceIndexRef.current =
          (shapeSequenceIndexRef.current + 1) % SHAPE_SEQUENCE.length;
        setTargetShape(SHAPE_SEQUENCE[shapeSequenceIndexRef.current], now);
        lastAutoMorphRef.current = now;
      }

      const morphElapsed = now - morphStartRef.current;
      const rawT = clamp(morphElapsed / transitionDuration, 0, 1);
      const eased = easeInOutCubic(rawT);

      const globalAngle = rotation ? t * 0.001 * rotationSpeed : 0;
      const cosA = Math.cos(globalAngle);
      const sinA = Math.sin(globalAngle);
      const breathe = pulse ? 1 + Math.sin(t * 0.0009) * 0.06 : 1;
      const nt = t * 0.00025;

      const {
        n,
        baseSize,
        brightness,
        noiseOffset,
        orbitPhase,
        orbitSpeed,
        orbitRadius,
        seed,
        sprite,
      } = field;
      const cur = currentPos.current;
      const start = startPos.current;
      const target = targetPos.current;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = glow ? "lighter" : "source-over";

      for (let i = 0; i < n; i++) {
        const x0 = lerp(start.x[i], target.x[i], eased);
        const y0 = lerp(start.y[i], target.y[i], eased);
        const z0 = lerp(start.z[i], target.z[i], eased);
        cur.x[i] = x0;
        cur.y[i] = y0;
        cur.z[i] = z0;

        const nOff = noiseOffset[i];
        const sd = seed[i];
        const driftX = noise3D(nOff + nt, sd, 0) * 10;
        const driftY = noise3D(sd, nOff + nt, 5) * 10;
        const driftZ = noise3D(nOff, sd, nt) * 10;

        const orbitAngle = t * 0.001 * orbitSpeed[i] + orbitPhase[i];
        const orbitX = Math.cos(orbitAngle) * orbitRadius[i];
        const orbitY = Math.sin(orbitAngle) * orbitRadius[i];

        const x = x0 + driftX + orbitX;
        const y = y0 + driftY + orbitY;
        const z = z0 + driftZ;

        const rx = x * cosA - z * sinA;
        const rz = x * sinA + z * cosA;

        const perspective = FOCAL_LENGTH / (FOCAL_LENGTH + rz + radius);
        let screenX = rx * perspective;
        let screenY = y * perspective;

        if ((mouseRepel || mouseAttract) && mouseRef.current.active) {
          const dx = screenX - mouseRef.current.x;
          const dy = screenY - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
          const influenceRadius = radius * 0.5;
          if (dist < influenceRadius) {
            const force = (1 - dist / influenceRadius) * 26;
            const dir = mouseRepel ? 1 : -1;
            screenX += (dx / dist) * force * dir;
            screenY += (dy / dist) * force * dir;
          }
        }

        const depthScale = clamp(perspective, 0.35, 1.4);
        const hoverBoost =
          hoverEffect && mouseRef.current.active
            ? 1 +
              clamp(
                1 -
                  Math.hypot(
                    screenX - mouseRef.current.x,
                    screenY - mouseRef.current.y,
                  ) /
                    (radius * 0.4),
                0,
                1,
              ) *
                0.6
            : 1;

        const drawSize = baseSize[i] * depthScale * breathe * hoverBoost;
        ctx.globalAlpha = clamp(brightness[i] * depthScale, 0.08, 1);
        ctx.drawImage(
          sprite[i],
          centerX + screenX - drawSize / 2,
          centerY + screenY - drawSize / 2,
          drawSize,
          drawSize,
        );
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, [
    field,
    width,
    height,
    radius,
    morphDuration,
    autoMorph,
    rotation,
    rotationSpeed,
    pulse,
    mouseRepel,
    mouseAttract,
    hoverEffect,
    glow,
    setTargetShape,
  ]);

  const needsPointerHandlers = mouseRepel || mouseAttract || hoverEffect;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width, height, background }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseMove={needsPointerHandlers ? handlePointerMove : undefined}
        onMouseLeave={needsPointerHandlers ? handlePointerLeave : undefined}
      />
    </div>
  );
}

export default ParticleMorph;
export type { ParticleMorphProps, ShapeName } from "@/types/particle-morph";
