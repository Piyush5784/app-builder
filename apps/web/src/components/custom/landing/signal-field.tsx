import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * A perspective field of dots that breathes slowly and ripples outward from
 * the cursor. Crests catch the acid accent, everything else stays quiet.
 */

const COLS = 150;
const ROWS = 70;
const WIDTH = 48;
const DEPTH = 26;

const vertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uScale;
  varying float vGlow;
  varying float vFade;
  void main() {
    vec3 p = position;
    float swell = sin(p.x * 0.32 + uTime * 0.55) * 0.22 + cos(p.z * 0.42 - uTime * 0.45) * 0.22;
    float d = distance(p.xz, uMouse);
    float ripple = sin(d * 1.5 - uTime * 2.6) * exp(-d * 0.32) * 0.55;
    p.y += swell + ripple;
    vGlow = clamp(smoothstep(0.28, 0.75, p.y) + exp(-d * 0.55) * 0.9, 0.0, 1.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vFade = smoothstep(-36.0, -12.0, mv.z) * (1.0 - smoothstep(-6.0, -2.0, mv.z));
    gl_PointSize = uScale * (1.6 + vGlow * 1.4) * (14.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uAccent;
  varying float vGlow;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.15, d) * vFade * (0.28 + vGlow * 0.72);
    gl_FragColor = vec4(mix(uBase, uAccent, vGlow), a);
  }
`;

export default function SignalField({
  className = "",
}: {
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return; // No WebGL: the CSS dot grid behind stays visible.
    }
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    Object.assign(renderer.domElement.style, {
      display: "block",
      width: "100%",
      height: "100%",
    });
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 5.2, 13);
    camera.lookAt(0, 0, -5);

    const positions = new Float32Array(COLS * ROWS * 3);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = (r * COLS + c) * 3;
        positions[i] = (c / (COLS - 1) - 0.5) * WIDTH;
        positions[i + 1] = 0;
        positions[i + 2] = -(r / (ROWS - 1)) * DEPTH + 6;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, -6) },
      uScale: { value: 1 },
      uBase: { value: new THREE.Color("#9AA0AA") },
      uAccent: { value: new THREE.Color("#C8FF3D") },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms,
      transparent: true,
      depthWrite: false,
    });
    scene.add(new THREE.Points(geo, mat));

    // Pointer → point on the y = 0 plane.
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();
    const target = new THREE.Vector2(0, -6);
    const onPointer = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      if (e.clientY > r.bottom) return;
      ndc.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) target.set(hit.x, hit.z);
    };

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = container;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      uniforms.uScale.value = (h * dpr) / 700;
      if (!running) renderer.render(scene, camera);
    };

    let running = false;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      uniforms.uTime.value += dt;
      uniforms.uMouse.value.lerp(target, 1 - Math.pow(0.02, dt));
      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduced) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && !document.hidden) start();
      else stop();
    });
    io.observe(container);
    const onVisibility = () =>
      document.hidden || !onScreen ? stop() : start();
    document.addEventListener("visibilitychange", onVisibility);
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    if (reduced) {
      uniforms.uTime.value = 2;
      renderer.render(scene, camera);
    } else {
      window.addEventListener("pointermove", onPointer, { passive: true });
      start();
    }

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className={className} />;
}
