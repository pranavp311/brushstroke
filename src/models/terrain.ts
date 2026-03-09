import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export function terrainModel(opts: { complexity: number; style: string; colors: ColorScheme; seed: number }): string {
  const segments = Math.floor(20 + opts.complexity * 80);
  const wireframe = opts.style === "wireframe" ? "true" : "false";
  const flatShading = opts.style === "flat" ? "true" : "false";

  return `
// Procedural Terrain (seed: ${opts.seed})
const terrainGroup = new THREE.Group();

const terrainGeometry = new THREE.PlaneGeometry(20, 20, ${segments}, ${segments});
terrainGeometry.rotateX(-Math.PI / 2);

// Seeded random
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const rng = seededRandom(${opts.seed});

// Simple noise from seed
function hashNoise(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 43.3) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const n00 = hashNoise(ix, iy, seed);
  const n10 = hashNoise(ix + 1, iy, seed);
  const n01 = hashNoise(ix, iy + 1, seed);
  const n11 = hashNoise(ix + 1, iy + 1, seed);
  return (n00 * (1-sx) + n10 * sx) * (1-sy) + (n01 * (1-sx) + n11 * sx) * sy;
}

function fbm(x, y, seed, octaves) {
  let v = 0, a = 1, f = 1, total = 0;
  for (let i = 0; i < octaves; i++) {
    v += a * smoothNoise(x * f, y * f, seed + i * 100);
    total += a;
    a *= 0.5;
    f *= 2;
  }
  return v / total;
}

const posAttr = terrainGeometry.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i);
  const z = posAttr.getZ(i);
  const height = fbm(x * 0.15, z * 0.15, ${opts.seed}, 6) * 8 - 4;
  posAttr.setY(i, height);
}
terrainGeometry.computeVertexNormals();

// Color vertices by height
const terrainColors = new Float32Array(posAttr.count * 3);
const c1 = ${hexToThreeColor(opts.colors.primary)};
const c2 = ${hexToThreeColor(opts.colors.secondary)};
const c3 = ${hexToThreeColor(opts.colors.accent)};
for (let i = 0; i < posAttr.count; i++) {
  const h = (posAttr.getY(i) + 4) / 8;
  const c = h < 0.5
    ? new THREE.Color().lerpColors(c1, c2, h * 2)
    : new THREE.Color().lerpColors(c2, c3, (h - 0.5) * 2);
  terrainColors[i * 3] = c.r;
  terrainColors[i * 3 + 1] = c.g;
  terrainColors[i * 3 + 2] = c.b;
}
terrainGeometry.setAttribute('color', new THREE.BufferAttribute(terrainColors, 3));

const terrainMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  wireframe: ${wireframe},
  flatShading: ${flatShading},
  ${opts.style === "toon" ? "// Use MeshToonMaterial for toon shading in production" : ""}
});

const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrainGroup.add(terrainMesh);
`;
}
