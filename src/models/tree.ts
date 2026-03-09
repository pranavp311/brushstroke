import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export function treeModel(opts: { complexity: number; style: string; colors: ColorScheme; seed: number }): string {
  const maxDepth = Math.floor(3 + opts.complexity * 5);

  return `
// Procedural L-System Tree (seed: ${opts.seed})
const treeGroup = new THREE.Group();

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const rng = seededRandom(${opts.seed});

const trunkColor = ${hexToThreeColor(opts.colors.primary)};
const leafColor = ${hexToThreeColor(opts.colors.secondary)};
const accentColor = ${hexToThreeColor(opts.colors.accent)};

function createBranch(parent, origin, direction, length, radius, depth, maxDepth) {
  if (depth > maxDepth || radius < 0.01) return;

  const segments = 8;
  const geo = new THREE.CylinderGeometry(radius * 0.7, radius, length, segments);
  geo.translate(0, length / 2, 0);

  const isLeafLevel = depth >= maxDepth - 1;
  const mat = new THREE.MeshStandardMaterial({
    color: isLeafLevel ? leafColor : trunkColor,
    flatShading: ${opts.style === "flat" ? "true" : "false"},
    wireframe: ${opts.style === "wireframe" ? "true" : "false"},
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(origin);

  // Orient branch along direction
  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize());
  mesh.quaternion.copy(quat);

  parent.add(mesh);

  // Add leaves at tips
  if (isLeafLevel) {
    const leafGeo = new THREE.SphereGeometry(length * 0.6, 6, 4);
    const leafMat = new THREE.MeshStandardMaterial({
      color: leafColor.clone().lerp(accentColor, rng() * 0.5),
      flatShading: true,
      wireframe: ${opts.style === "wireframe" ? "true" : "false"},
    });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0, length, 0);
    mesh.add(leaf);
    return;
  }

  // Branch into 2-3 children
  const numBranches = 2 + (rng() > 0.5 ? 1 : 0);
  const endPoint = new THREE.Vector3(0, length, 0);

  for (let i = 0; i < numBranches; i++) {
    const angle = (rng() - 0.5) * 1.2;
    const tilt = 0.3 + rng() * 0.5;

    const newDir = new THREE.Vector3(
      Math.sin(angle) * tilt,
      1 - tilt * 0.3,
      Math.cos(angle) * tilt * (rng() > 0.5 ? 1 : -1)
    ).normalize();

    createBranch(
      mesh,
      endPoint,
      newDir,
      length * (0.65 + rng() * 0.15),
      radius * (0.55 + rng() * 0.15),
      depth + 1,
      maxDepth
    );
  }
}

// Start tree
createBranch(
  treeGroup,
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 1, 0),
  3,
  0.3,
  0,
  ${maxDepth}
);
`;
}
