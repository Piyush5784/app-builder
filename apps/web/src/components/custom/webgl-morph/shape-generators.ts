import * as THREE from "three";
import type { WebglShapeName } from "@/types/webgl-morph";

function generateSphere(count: number, size: number): Float32Array {
  const points = new Float32Array(count * 3);
  const phi = Math.PI * (Math.sqrt(5) - 1);
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;
    points[i * 3] = Math.cos(theta) * radius * size;
    points[i * 3 + 1] = y * size;
    points[i * 3 + 2] = Math.sin(theta) * radius * size;
  }
  return points;
}

function generateCube(count: number, size: number): Float32Array {
  const points = new Float32Array(count * 3);
  const halfSize = size / 2;
  for (let i = 0; i < count; i++) {
    const face = Math.floor(Math.random() * 6);
    const u = Math.random() * size - halfSize;
    const v = Math.random() * size - halfSize;
    switch (face) {
      case 0:
        points.set([halfSize, u, v], i * 3);
        break;
      case 1:
        points.set([-halfSize, u, v], i * 3);
        break;
      case 2:
        points.set([u, halfSize, v], i * 3);
        break;
      case 3:
        points.set([u, -halfSize, v], i * 3);
        break;
      case 4:
        points.set([u, v, halfSize], i * 3);
        break;
      default:
        points.set([u, v, -halfSize], i * 3);
    }
  }
  return points;
}

// Samples the base uniformly and the four triangular side faces weighted by
// their actual surface area, so particle density stays even across the shape
// rather than clumping on whichever face happens to get more random draws.
function generatePyramid(count: number, size: number): Float32Array {
  const points = new Float32Array(count * 3);
  const halfBase = size / 2;
  const height = size * 1.2;
  const apex = new THREE.Vector3(0, height / 2, 0);
  const baseVertices = [
    new THREE.Vector3(-halfBase, -height / 2, -halfBase),
    new THREE.Vector3(halfBase, -height / 2, -halfBase),
    new THREE.Vector3(halfBase, -height / 2, halfBase),
    new THREE.Vector3(-halfBase, -height / 2, halfBase),
  ];
  const baseArea = size * size;
  const sideFaceHeight = Math.sqrt(height ** 2 + halfBase ** 2);
  const sideFaceArea = 0.5 * size * sideFaceHeight;
  const totalArea = baseArea + 4 * sideFaceArea;
  const baseWeight = baseArea / totalArea;
  const sideWeight = sideFaceArea / totalArea;

  const tempA = new THREE.Vector3();
  const tempB = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const r = Math.random();
    const p = new THREE.Vector3();
    let u: number;
    let v: number;

    if (r < baseWeight) {
      u = Math.random();
      v = Math.random();
      p.lerpVectors(baseVertices[0], baseVertices[1], u);
      tempA.lerpVectors(baseVertices[3], baseVertices[2], u);
      p.lerp(tempA, v);
    } else {
      const faceIndex = Math.floor((r - baseWeight) / sideWeight);
      const v1 = baseVertices[faceIndex];
      const v2 = baseVertices[(faceIndex + 1) % 4];
      u = Math.random();
      v = Math.random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      p.addVectors(v1, tempA.subVectors(v2, v1).multiplyScalar(u));
      p.add(tempB.subVectors(apex, v1).multiplyScalar(v));
    }

    points.set([p.x, p.y, p.z], i * 3);
  }
  return points;
}

function generateTorus(count: number, size: number): Float32Array {
  const points = new Float32Array(count * 3);
  const R = size * 0.7;
  const r = size * 0.3;
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    points[i * 3] = (R + r * Math.cos(phi)) * Math.cos(theta);
    points[i * 3 + 1] = r * Math.sin(phi);
    points[i * 3 + 2] = (R + r * Math.cos(phi)) * Math.sin(theta);
  }
  return points;
}

function generateGalaxy(count: number, size: number): Float32Array {
  const points = new Float32Array(count * 3);
  const arms = 4;
  const armWidth = 0.6;
  const bulgeFactor = 0.3;
  for (let i = 0; i < count; i++) {
    const t = Math.random() ** 1.5;
    const radius = t * size;
    const armIndex = Math.floor(Math.random() * arms);
    const armOffset = (armIndex / arms) * Math.PI * 2;
    const rotationAmount = (radius / size) * 6;
    const angle = armOffset + rotationAmount;
    const spread = (Math.random() - 0.5) * armWidth * (1 - radius / size);
    const theta = angle + spread;
    points[i * 3] = radius * Math.cos(theta);
    points[i * 3 + 1] =
      (Math.random() - 0.5) * size * 0.1 * (1 - (radius / size) * bulgeFactor);
    points[i * 3 + 2] = radius * Math.sin(theta);
  }
  return points;
}

function generateWave(count: number, size: number): Float32Array {
  const points = new Float32Array(count * 3);
  const waveScale = size * 0.4;
  const frequency = 3;
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const v = Math.random() * 2 - 1;
    const dist = Math.sqrt(u * u + v * v);
    const angle = Math.atan2(v, u);
    points[i * 3] = u * size;
    points[i * 3 + 1] =
      Math.sin(dist * Math.PI * frequency) *
      Math.cos(angle * 2) *
      waveScale *
      (1 - dist);
    points[i * 3 + 2] = v * size;
  }
  return points;
}

const GENERATORS: Record<
  WebglShapeName,
  (count: number, size: number) => Float32Array
> = {
  sphere: generateSphere,
  cube: generateCube,
  pyramid: generatePyramid,
  torus: generateTorus,
  galaxy: generateGalaxy,
  wave: generateWave,
};

export const SHAPE_SEQUENCE: WebglShapeName[] = [
  "sphere",
  "cube",
  "pyramid",
  "torus",
  "galaxy",
  "wave",
];

export function getShapePoints(
  shape: WebglShapeName,
  count: number,
  size: number,
): Float32Array {
  return GENERATORS[shape](count, size);
}
