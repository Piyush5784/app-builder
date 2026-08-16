import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  getShapePoints,
  SHAPE_SEQUENCE,
} from "@/components/custom/webgl-morph/shape-generators";
import { getStarTexture } from "@/components/custom/webgl-morph/star-texture";
import {
  BLOOM_RADIUS,
  BLOOM_THRESHOLD,
  COLOR_SCHEME_NAMES,
  COLOR_SCHEME_SWATCHES,
  COLOR_SCHEMES,
  DEFAULT_BLOOM_STRENGTH,
  DEFAULT_CAMERA_DISTANCE,
  DEFAULT_MORPH_DURATION,
  DEFAULT_MORPH_INTERVAL,
  DEFAULT_PARTICLE_COUNT,
  DEFAULT_SHAPE_SIZE,
  DEFAULT_STAR_COUNT,
  IDLE_FLOW_SPEED,
  IDLE_FLOW_STRENGTH,
  IDLE_ROTATION_SPEED,
  MORPH_BRIGHTNESS_FACTOR,
  MORPH_SIZE_FACTOR,
  NOISE_FREQUENCY,
  NOISE_MAX_STRENGTH,
  NOISE_TIME_SCALE,
  PARTICLE_SIZE_RANGE,
  SWIRL_FACTOR,
} from "@/components/custom/webgl-morph/constants";
import {
  clamp,
  easeInOutCubic,
  mulberry32,
  noise3D,
  randRange,
} from "@/utils/particle-math";
import type { WebglColorScheme, WebglMorphProps } from "@/types/webgl-morph";

export function WebglMorph({
  position = "fill",
  className = "",
  particleCount = DEFAULT_PARTICLE_COUNT,
  shapeSize = DEFAULT_SHAPE_SIZE,
  colorScheme = "fire",
  autoMorph = true,
  morphInterval = DEFAULT_MORPH_INTERVAL,
  morphDuration = DEFAULT_MORPH_DURATION,
  starCount = DEFAULT_STAR_COUNT,
  bloomStrength = DEFAULT_BLOOM_STRENGTH,
  cameraDistance = DEFAULT_CAMERA_DISTANCE,
  showControls = false,
}: WebglMorphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorSchemeRef = useRef<WebglColorScheme>(colorScheme);
  const triggerMorphRef = useRef<() => void>(() => {});
  const repaintRef = useRef<() => void>(() => {});
  const [activeScheme, setActiveScheme] =
    useState<WebglColorScheme>(colorScheme);
  const [shapeLabel, setShapeLabel] = useState<string>(SHAPE_SEQUENCE[0]);
  const [isMorphingUi, setIsMorphingUi] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000308, 0.03);

    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
    camera.position.set(0, cameraDistance * 0.3, cameraDistance);
    camera.lookAt(scene.position);

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      bloomStrength,
      BLOOM_RADIUS,
      BLOOM_THRESHOLD,
    );
    composer.addPass(bloomPass);

    scene.add(new THREE.AmbientLight(0x404060));
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(15, 20, 10);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0x88aaff, 0.9);
    dirLight2.position.set(-15, -10, -15);
    scene.add(dirLight2);

    const starTexture = getStarTexture();
    const starVertices: number[] = [];
    const starSizes: number[] = [];
    const starColors: number[] = [];
    const tempVec = new THREE.Vector3();
    for (let i = 0; i < starCount; i++) {
      tempVec.set(
        THREE.MathUtils.randFloatSpread(400),
        THREE.MathUtils.randFloatSpread(400),
        THREE.MathUtils.randFloatSpread(400),
      );
      if (tempVec.length() < 100) tempVec.setLength(100 + Math.random() * 300);
      starVertices.push(tempVec.x, tempVec.y, tempVec.z);
      starSizes.push(Math.random() * 0.15 + 0.05);
      const color = new THREE.Color();
      if (Math.random() < 0.1) color.setHSL(Math.random(), 0.7, 0.65);
      else color.setHSL(0.6, Math.random() * 0.1, 0.8 + Math.random() * 0.2);
      starColors.push(color.r, color.g, color.b);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3),
    );
    starGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(starColors, 3),
    );
    starGeometry.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(starSizes, 1),
    );
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: { pointTexture: { value: starTexture } },
      vertexShader: `
        attribute float size; varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }`,
      fragmentShader: `
        uniform sampler2D pointTexture; varying vec3 vColor;
        void main() {
          float alpha = texture2D(pointTexture, gl_PointCoord).a;
          if (alpha < 0.1) discard;
          gl_FragColor = vec4(vColor, alpha * 0.9);
        }`,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
    });
    scene.add(new THREE.Points(starGeometry, starMaterial));

    const targetPositions = SHAPE_SEQUENCE.map((shape) =>
      getShapePoints(shape, particleCount, shapeSize),
    );
    let currentShapeIndex = 0;
    const currentPositions = new Float32Array(targetPositions[0]);
    const sourcePositions = new Float32Array(targetPositions[0]);
    const swarmPositions = new Float32Array(particleCount * 3);

    const particleSizes = new Float32Array(particleCount);
    const particleOpacities = new Float32Array(particleCount);
    const particleEffectStrengths = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const rng = mulberry32(i * 9973 + 17);
      particleSizes[i] = randRange(
        rng,
        PARTICLE_SIZE_RANGE[0],
        PARTICLE_SIZE_RANGE[1],
      );
      particleOpacities[i] = 1;
      particleEffectStrengths[i] = 0;
    }

    function paintColors(target: Float32Array, positions: Float32Array) {
      const scheme = COLOR_SCHEMES[colorSchemeRef.current];
      const maxRadius = shapeSize * 1.1;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        tempVec.fromArray(positions, i3);
        const dist = tempVec.length();
        let hue: number;
        if (colorSchemeRef.current === "rainbow") {
          const normX = (tempVec.x / maxRadius + 1) / 2;
          const normY = (tempVec.y / maxRadius + 1) / 2;
          const normZ = (tempVec.z / maxRadius + 1) / 2;
          hue = (normX * 120 + normY * 120 + normZ * 120) % 360;
        } else {
          hue = THREE.MathUtils.mapLinear(
            dist,
            0,
            maxRadius,
            scheme.startHue,
            scheme.endHue,
          );
        }
        const n =
          (noise3D(tempVec.x * 0.2, tempVec.y * 0.2, tempVec.z * 0.2) + 1) *
          0.5;
        const saturation = clamp(scheme.saturation * (0.9 + n * 0.2), 0, 1);
        const lightness = clamp(scheme.lightness * (0.85 + n * 0.3), 0.1, 0.9);
        const color = new THREE.Color().setHSL(
          hue / 360,
          saturation,
          lightness,
        );
        color.toArray(target, i3);
      }
    }

    const colors = new Float32Array(particleCount * 3);
    paintColors(colors, currentPositions);

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(currentPositions, 3),
    );
    particlesGeometry.setAttribute(
      "size",
      new THREE.BufferAttribute(particleSizes, 1),
    );
    particlesGeometry.setAttribute(
      "opacity",
      new THREE.BufferAttribute(particleOpacities, 1),
    );
    particlesGeometry.setAttribute(
      "aEffectStrength",
      new THREE.BufferAttribute(particleEffectStrengths, 1),
    );
    particlesGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3),
    );

    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: { pointTexture: { value: starTexture } },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        attribute float aEffectStrength;
        varying vec3 vColor;
        varying float vOpacity;
        varying float vEffectStrength;
        void main() {
          vColor = color;
          vOpacity = opacity;
          vEffectStrength = aEffectStrength;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float sizeScale = 1.0 - vEffectStrength * ${MORPH_SIZE_FACTOR.toFixed(2)};
          gl_PointSize = size * sizeScale * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }`,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        varying float vOpacity;
        varying float vEffectStrength;
        void main() {
          float alpha = texture2D(pointTexture, gl_PointCoord).a;
          if (alpha < 0.05) discard;
          vec3 finalColor = vColor * (1.0 + vEffectStrength * ${MORPH_BRIGHTNESS_FACTOR.toFixed(2)});
          gl_FragColor = vec4(finalColor, alpha * vOpacity);
        }`,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
    });

    const particleSystem = new THREE.Points(
      particlesGeometry,
      particlesMaterial,
    );
    scene.add(particleSystem);

    let isMorphing = false;
    let morphStart = 0;
    let morphEnd = 0;
    const sourceVec = new THREE.Vector3();
    const targetVec = new THREE.Vector3();
    const swarmVec = new THREE.Vector3();
    const offsetDir = new THREE.Vector3();
    const noiseOffsetVec = new THREE.Vector3();
    const bezPos = new THREE.Vector3();
    const swirlAxis = new THREE.Vector3();

    function triggerMorph(now: number) {
      isMorphing = true;
      setIsMorphingUi(true);
      sourcePositions.set(currentPositions);
      const nextShapeIndex = (currentShapeIndex + 1) % SHAPE_SEQUENCE.length;
      const nextTarget = targetPositions[nextShapeIndex];
      const centerOffset = shapeSize * 1.5;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        sourceVec.fromArray(sourcePositions, i3);
        targetVec.fromArray(nextTarget, i3);
        swarmVec.lerpVectors(sourceVec, targetVec, 0.5);
        offsetDir
          .set(
            noise3D(i * 0.05, 10, 10),
            noise3D(20, i * 0.05, 20),
            noise3D(30, 30, i * 0.05),
          )
          .normalize();
        const distFactor = sourceVec.distanceTo(targetVec) * 0.1 + centerOffset;
        swarmVec.addScaledVector(
          offsetDir,
          distFactor * (0.5 + Math.random() * 0.8),
        );
        swarmPositions[i3] = swarmVec.x;
        swarmPositions[i3 + 1] = swarmVec.y;
        swarmPositions[i3 + 2] = swarmVec.z;
      }

      currentShapeIndex = nextShapeIndex;
      morphStart = now;
      morphEnd = now + morphDuration;
    }

    function finishMorph() {
      currentPositions.set(targetPositions[currentShapeIndex]);
      particlesGeometry.attributes.position.needsUpdate = true;
      particleEffectStrengths.fill(0);
      particlesGeometry.attributes.aEffectStrength.needsUpdate = true;
      sourcePositions.set(targetPositions[currentShapeIndex]);
      paintColors(colors, currentPositions);
      particlesGeometry.attributes.color.needsUpdate = true;
      isMorphing = false;
      setIsMorphingUi(false);
      setShapeLabel(SHAPE_SEQUENCE[currentShapeIndex]);
    }

    triggerMorphRef.current = () => {
      if (!isMorphing) triggerMorph(clock.getElapsedTime() * 1000);
    };
    repaintRef.current = () => {
      paintColors(colors, currentPositions);
      particlesGeometry.attributes.color.needsUpdate = true;
    };

    function resize() {
      const clientWidth = containerRef.current?.clientWidth ?? 1;
      const clientHeight = containerRef.current?.clientHeight ?? 1;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      composer.setSize(clientWidth, clientHeight);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const clock = new THREE.Clock();
    let lastMorphEndTime = 0;
    let rafId = 0;

    function tick() {
      rafId = requestAnimationFrame(tick);
      const elapsed = clock.getElapsedTime();
      const t = elapsed * 1000;

      if (autoMorph && !isMorphing && t - lastMorphEndTime > morphInterval) {
        triggerMorph(t);
      }

      const orbitAngle = elapsed * IDLE_ROTATION_SPEED;
      camera.position.x = Math.sin(orbitAngle) * cameraDistance;
      camera.position.z = Math.cos(orbitAngle) * cameraDistance;
      camera.lookAt(scene.position);

      const positions = particlesGeometry.attributes.position
        .array as Float32Array;
      const effectStrengths = particlesGeometry.attributes.aEffectStrength
        .array as Float32Array;

      if (isMorphing) {
        const rawT = clamp((t - morphStart) / (morphEnd - morphStart), 0, 1);
        const eased = easeInOutCubic(rawT);
        const strength = Math.sin(rawT * Math.PI);
        const swirl = strength * SWIRL_FACTOR * 0.05;
        const noiseAmount = strength * NOISE_MAX_STRENGTH;
        const targets = targetPositions[currentShapeIndex];
        const noiseTime = elapsed * NOISE_TIME_SCALE;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          sourceVec.fromArray(sourcePositions, i3);
          swarmVec.fromArray(swarmPositions, i3);
          targetVec.fromArray(targets, i3);

          const tInv = 1 - eased;
          bezPos.copy(sourceVec).multiplyScalar(tInv * tInv);
          bezPos.addScaledVector(swarmVec, 2 * tInv * eased);
          bezPos.addScaledVector(targetVec, eased * eased);

          if (swirl > 0.01) {
            const delta = tempVec.subVectors(bezPos, sourceVec);
            swirlAxis
              .set(
                noise3D(i * 0.02, elapsed * 0.1, 0),
                noise3D(0, i * 0.02, elapsed * 0.1 + 5),
                noise3D(elapsed * 0.1 + 10, 0, i * 0.02),
              )
              .normalize();
            delta.applyAxisAngle(
              swirlAxis,
              swirl * (0.5 + Math.random() * 0.5),
            );
            bezPos.copy(sourceVec).add(delta);
          }

          if (noiseAmount > 0.01) {
            noiseOffsetVec.set(
              noise3D(
                bezPos.x * NOISE_FREQUENCY + noiseTime,
                bezPos.y * NOISE_FREQUENCY,
                bezPos.z * NOISE_FREQUENCY,
              ),
              noise3D(
                bezPos.x * NOISE_FREQUENCY + 100,
                bezPos.y * NOISE_FREQUENCY + noiseTime,
                bezPos.z * NOISE_FREQUENCY + 100,
              ),
              noise3D(
                bezPos.x * NOISE_FREQUENCY + 200,
                bezPos.y * NOISE_FREQUENCY + 200,
                bezPos.z * NOISE_FREQUENCY + noiseTime,
              ),
            );
            bezPos.addScaledVector(noiseOffsetVec, noiseAmount);
          }

          positions[i3] = bezPos.x;
          positions[i3 + 1] = bezPos.y;
          positions[i3 + 2] = bezPos.z;
          effectStrengths[i] = strength;
        }
        particlesGeometry.attributes.position.needsUpdate = true;
        particlesGeometry.attributes.aEffectStrength.needsUpdate = true;

        if (rawT >= 1) {
          lastMorphEndTime = t;
          finishMorph();
        }
      } else {
        const breathe = 1 + Math.sin(elapsed * 0.5) * 0.015;
        const flowTime = elapsed * IDLE_FLOW_SPEED;
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          sourceVec.fromArray(sourcePositions, i3);
          tempVec.copy(sourceVec).multiplyScalar(breathe);
          noiseOffsetVec.set(
            noise3D(
              tempVec.x * NOISE_FREQUENCY + flowTime,
              tempVec.y * NOISE_FREQUENCY,
              tempVec.z * NOISE_FREQUENCY,
            ),
            noise3D(
              tempVec.x * NOISE_FREQUENCY + 10,
              tempVec.y * NOISE_FREQUENCY + flowTime,
              tempVec.z * NOISE_FREQUENCY + 10,
            ),
            noise3D(
              tempVec.x * NOISE_FREQUENCY + 20,
              tempVec.y * NOISE_FREQUENCY + 20,
              tempVec.z * NOISE_FREQUENCY + flowTime,
            ),
          );
          tempVec.addScaledVector(noiseOffsetVec, IDLE_FLOW_STRENGTH);
          bezPos.fromArray(positions, i3).lerp(tempVec, 0.05);
          positions[i3] = bezPos.x;
          positions[i3 + 1] = bezPos.y;
          positions[i3 + 2] = bezPos.z;
        }
        particlesGeometry.attributes.position.needsUpdate = true;
      }

      composer.render();
    }
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      composer.dispose();
      renderer.dispose();
      container.removeChild(canvas);
    };
  }, [
    particleCount,
    shapeSize,
    autoMorph,
    morphInterval,
    morphDuration,
    starCount,
    bloomStrength,
    cameraDistance,
  ]);

  useEffect(() => {
    colorSchemeRef.current = colorScheme;
    repaintRef.current();
  }, [colorScheme]);

  const [trackedColorScheme, setTrackedColorScheme] = useState(colorScheme);
  if (colorScheme !== trackedColorScheme) {
    setTrackedColorScheme(colorScheme);
    setActiveScheme(colorScheme);
  }

  function handlePickScheme(scheme: WebglColorScheme) {
    colorSchemeRef.current = scheme;
    setActiveScheme(scheme);
    repaintRef.current();
  }

  const positionClass =
    position === "background" ? "fixed inset-0 -z-10" : "absolute inset-0";

  return (
    <div
      ref={containerRef}
      className={`${positionClass} ${showControls ? "" : "pointer-events-none"} ${className}`}
      onClick={showControls ? () => triggerMorphRef.current() : undefined}
    >
      {showControls && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
          <div className="rounded-lg border border-white/10 bg-black/35 px-4 py-2 text-xs text-white shadow-lg backdrop-blur-md">
            Shape: {shapeLabel[0].toUpperCase() + shapeLabel.slice(1)}{" "}
            {isMorphingUi ? "(Morphing...)" : "(Click to morph)"}
          </div>
        </div>
      )}
      {showControls && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center">
          <div
            className="pointer-events-auto flex items-center gap-4 rounded-xl border border-white/10 bg-black/40 px-5 py-3 shadow-lg backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => triggerMorphRef.current()}
              className="rounded-md border border-sky-400/60 bg-sky-900/60 px-3 py-1.5 text-sm text-white transition-colors hover:bg-sky-700/70"
            >
              Change Shape
            </button>
            <div className="flex items-center gap-2.5">
              {COLOR_SCHEME_NAMES.map((scheme) => (
                <button
                  key={scheme}
                  type="button"
                  aria-label={`${scheme} color scheme`}
                  onClick={() => handlePickScheme(scheme)}
                  className={`size-6 rounded-full border-2 transition-transform ${
                    activeScheme === scheme
                      ? "scale-110 border-white"
                      : "border-white/25 hover:scale-105"
                  }`}
                  style={{ background: COLOR_SCHEME_SWATCHES[scheme] }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebglMorph;
