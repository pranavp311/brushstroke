import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export function abstractSculptureModel(opts: { complexity: number; style: string; colors: ColorScheme; seed: number }): string {
  const detail = Math.floor(2 + opts.complexity * 4);

  return `
// Procedural Abstract Sculpture (seed: ${opts.seed})
const sculptureGroup = new THREE.Group();

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const rng = seededRandom(${opts.seed});

// Base geometry: noise-displaced sphere
const baseGeo = new THREE.IcosahedronGeometry(3, ${detail});
const posAttr = baseGeo.attributes.position;

// Multi-octave displacement
for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i);
  const y = posAttr.getY(i);
  const z = posAttr.getZ(i);
  const len = Math.sqrt(x*x + y*y + z*z);
  const nx = x/len, ny = y/len, nz = z/len;

  // Layered noise displacement
  let disp = 0;
  let freq = 1, amp = 1;
  for (let o = 0; o < 4; o++) {
    const px = nx * freq + ${opts.seed} * 0.01;
    const py = ny * freq + ${opts.seed} * 0.013;
    const pz = nz * freq + ${opts.seed} * 0.017;
    const n = Math.sin(px * 3.1 + py * 2.7) * Math.cos(pz * 2.3 + px) * 0.5 + 0.5;
    disp += n * amp;
    freq *= 2.1;
    amp *= 0.45;
  }

  const newLen = len * (0.6 + disp * 0.8 * ${opts.complexity.toFixed(2)});
  posAttr.setXYZ(i, nx * newLen, ny * newLen, nz * newLen);
}
baseGeo.computeVertexNormals();

// Color by normal direction
const colors = new Float32Array(posAttr.count * 3);
const c1 = ${hexToThreeColor(opts.colors.primary)};
const c2 = ${hexToThreeColor(opts.colors.secondary)};
const c3 = ${hexToThreeColor(opts.colors.accent)};
const normals = baseGeo.attributes.normal;
for (let i = 0; i < posAttr.count; i++) {
  const ny = normals.getY(i);
  const t = ny * 0.5 + 0.5;
  const c = t < 0.5
    ? new THREE.Color().lerpColors(c1, c2, t * 2)
    : new THREE.Color().lerpColors(c2, c3, (t - 0.5) * 2);
  colors[i * 3] = c.r;
  colors[i * 3 + 1] = c.g;
  colors[i * 3 + 2] = c.b;
}
baseGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const mat = new THREE.MeshStandardMaterial({
  vertexColors: true,
  metalness: 0.4,
  roughness: 0.3,
  flatShading: ${opts.style === "flat" ? "true" : "false"},
  wireframe: ${opts.style === "wireframe" ? "true" : "false"},
});

const sculpture = new THREE.Mesh(baseGeo, mat);
sculptureGroup.add(sculpture);

// Orbiting ring
const ringGeo = new THREE.TorusGeometry(4, 0.08, 8, 64);
const ringMat = new THREE.MeshStandardMaterial({
  color: ${hexToThreeColor(opts.colors.accent)},
  metalness: 0.8,
  roughness: 0.1,
});
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI * 0.3;
sculptureGroup.add(ring);
`;
}
