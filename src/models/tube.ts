import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export interface TubeOptions {
  splinePoints?: Array<{ x: number; y: number; z: number }>;
  radius?: number;
  tubularSegments?: number;
  radialSegments?: number;
  closed?: boolean;
}

export function tubeModel(opts: {
  complexity: number;
  style: string;
  colors: ColorScheme;
  seed: number;
  tubeOptions?: TubeOptions;
}): string {
  const tubeOpts = opts.tubeOptions ?? {};
  const points = tubeOpts.splinePoints ?? [
    { x: -3, y: 0, z: 0 },
    { x: -1.5, y: 1.5, z: 1 },
    { x: 0, y: 0, z: 0 },
    { x: 1.5, y: -1.5, z: -1 },
    { x: 3, y: 0, z: 0 },
  ];
  const radius = tubeOpts.radius ?? 0.15;
  const tubularSegments = tubeOpts.tubularSegments ?? Math.round(64 + opts.complexity * 128);
  const radialSegments = tubeOpts.radialSegments ?? Math.round(8 + opts.complexity * 16);
  const closed = tubeOpts.closed ?? false;

  const pointsCode = points
    .map(p => `new THREE.Vector3(${p.x}, ${p.y}, ${p.z})`)
    .join(",\n    ");

  const materialCode = getMaterialCode(opts.style, opts.colors);

  return `// Tube Model
const tubeSplinePoints = [
    ${pointsCode}
];
const tubeCurve = new THREE.CatmullRomCurve3(tubeSplinePoints, ${closed});
const tubeGeometry = new THREE.TubeGeometry(tubeCurve, ${tubularSegments}, ${radius}, ${radialSegments}, ${closed});
${materialCode}
const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
tubeMesh.castShadow = true;
tubeMesh.receiveShadow = true;

const tubeGroup = new THREE.Group();
tubeGroup.add(tubeMesh);`;
}

export function torusModel(opts: {
  complexity: number;
  style: string;
  colors: ColorScheme;
  seed: number;
}): string {
  const majorRadius = 1.5;
  const minorRadius = 0.4;
  const radialSegments = Math.round(16 + opts.complexity * 48);
  const tubularSegments = Math.round(32 + opts.complexity * 96);
  const materialCode = getMaterialCode(opts.style, opts.colors);

  return `// Torus Model
const torusGeometry = new THREE.TorusGeometry(${majorRadius}, ${minorRadius}, ${radialSegments}, ${tubularSegments});
${materialCode}
const torusMesh = new THREE.Mesh(torusGeometry, tubeMaterial);
torusMesh.castShadow = true;
torusMesh.receiveShadow = true;

const torusGroup = new THREE.Group();
torusGroup.add(torusMesh);`;
}

export function helixModel(opts: {
  complexity: number;
  style: string;
  colors: ColorScheme;
  seed: number;
  tubeOptions?: TubeOptions;
}): string {
  const radius = opts.tubeOptions?.radius ?? 0.1;
  const turns = 3 + Math.round(opts.complexity * 4);
  const pointsPerTurn = Math.round(16 + opts.complexity * 32);
  const totalPoints = turns * pointsPerTurn;
  const helixRadius = 1.5;
  const helixHeight = 4;
  const tubularSegments = opts.tubeOptions?.tubularSegments ?? totalPoints * 2;
  const radialSegments = opts.tubeOptions?.radialSegments ?? Math.round(8 + opts.complexity * 8);
  const materialCode = getMaterialCode(opts.style, opts.colors);

  return `// Helix Model
const helixPoints = [];
const helixTurns = ${turns};
const helixPointsPerTurn = ${pointsPerTurn};
const helixTotalPoints = helixTurns * helixPointsPerTurn;
for (let i = 0; i <= helixTotalPoints; i++) {
  const t = i / helixTotalPoints;
  const angle = t * Math.PI * 2 * helixTurns;
  helixPoints.push(new THREE.Vector3(
    Math.cos(angle) * ${helixRadius.toFixed(2)},
    (t - 0.5) * ${helixHeight.toFixed(2)},
    Math.sin(angle) * ${helixRadius.toFixed(2)}
  ));
}
const helixCurve = new THREE.CatmullRomCurve3(helixPoints, false);
const helixGeometry = new THREE.TubeGeometry(helixCurve, ${tubularSegments}, ${radius}, ${radialSegments}, false);
${materialCode}
const helixMesh = new THREE.Mesh(helixGeometry, tubeMaterial);
helixMesh.castShadow = true;
helixMesh.receiveShadow = true;

const helixGroup = new THREE.Group();
helixGroup.add(helixMesh);`;
}

function getMaterialCode(style: string, colors: ColorScheme): string {
  switch (style) {
    case "wireframe":
      return `const tubeMaterial = new THREE.MeshStandardMaterial({
  color: ${hexToThreeColor(colors.primary)},
  wireframe: true,
  metalness: 0.5,
  roughness: 0.3,
});`;
    case "neon_wire":
      return `const tubeMaterial = new THREE.MeshStandardMaterial({
  color: ${hexToThreeColor(colors.accent)},
  emissive: ${hexToThreeColor(colors.accent)},
  emissiveIntensity: 2.0,
  metalness: 0.9,
  roughness: 0.1,
});`;
    case "hologram":
      return `const tubeMaterial = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(colors.accent)},
  metalness: 0.1,
  roughness: 0.0,
  transmission: 0.9,
  thickness: 0.5,
  emissive: ${hexToThreeColor(colors.accent)},
  emissiveIntensity: 0.5,
});`;
    case "toon":
      return `const tubeMaterial = new THREE.MeshToonMaterial({
  color: ${hexToThreeColor(colors.primary)},
});`;
    default:
      return `const tubeMaterial = new THREE.MeshStandardMaterial({
  color: ${hexToThreeColor(colors.primary)},
  metalness: 0.8,
  roughness: 0.15,
});`;
  }
}
