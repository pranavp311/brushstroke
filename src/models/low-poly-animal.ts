import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export function lowPolyAnimalModel(opts: { complexity: number; style: string; colors: ColorScheme; seed: number }): string {
  return `
// Procedural Low-Poly Animal (seed: ${opts.seed})
const animalGroup = new THREE.Group();

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const rng = seededRandom(${opts.seed});

const mainColor = ${hexToThreeColor(opts.colors.primary)};
const accentColor = ${hexToThreeColor(opts.colors.accent)};
const matOpts = {
  flatShading: true,
  wireframe: ${opts.style === "wireframe" ? "true" : "false"},
};

// Body
const bodyGeo = new THREE.IcosahedronGeometry(1.5, 1);
const bodyPos = bodyGeo.attributes.position;
// Stretch into ellipsoid
for (let i = 0; i < bodyPos.count; i++) {
  bodyPos.setX(i, bodyPos.getX(i) * 0.8);
  bodyPos.setY(i, bodyPos.getY(i) * 0.7);
  bodyPos.setZ(i, bodyPos.getZ(i) * 1.3);
}
bodyGeo.computeVertexNormals();
const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: mainColor, ...matOpts }));
body.position.y = 1.5;
animalGroup.add(body);

// Head
const headGeo = new THREE.IcosahedronGeometry(0.8, 1);
const headPos = headGeo.attributes.position;
for (let i = 0; i < headPos.count; i++) {
  const z = headPos.getZ(i);
  if (z > 0) headPos.setZ(i, z * 1.3); // Elongate snout
}
headGeo.computeVertexNormals();
const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: mainColor, ...matOpts }));
head.position.set(0, 2.0, 1.8);
animalGroup.add(head);

// Eyes
const eyeGeo = new THREE.SphereGeometry(0.12, 6, 4);
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, ...matOpts });
const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
eyeL.position.set(-0.35, 2.2, 2.3);
animalGroup.add(eyeL);
const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
eyeR.position.set(0.35, 2.2, 2.3);
animalGroup.add(eyeR);

// Ears
const earGeo = new THREE.ConeGeometry(0.3, 0.6, 4);
const earMat = new THREE.MeshStandardMaterial({ color: accentColor, ...matOpts });
const earL = new THREE.Mesh(earGeo, earMat);
earL.position.set(-0.45, 2.8, 1.6);
earL.rotation.z = 0.3;
animalGroup.add(earL);
const earR = new THREE.Mesh(earGeo, earMat);
earR.position.set(0.45, 2.8, 1.6);
earR.rotation.z = -0.3;
animalGroup.add(earR);

// Legs (4)
const legGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.2, 6);
const legMat = new THREE.MeshStandardMaterial({ color: mainColor, ...matOpts });
const legPositions = [
  [-0.6, 0.6, 0.8],
  [0.6, 0.6, 0.8],
  [-0.6, 0.6, -0.8],
  [0.6, 0.6, -0.8],
];
legPositions.forEach(([x, y, z]) => {
  const leg = new THREE.Mesh(legGeo, legMat);
  leg.position.set(x, y, z);
  animalGroup.add(leg);
});

// Tail
const tailGeo = new THREE.ConeGeometry(0.15, 1, 4);
const tail = new THREE.Mesh(tailGeo, new THREE.MeshStandardMaterial({ color: accentColor, ...matOpts }));
tail.position.set(0, 1.8, -1.8);
tail.rotation.x = -0.8;
animalGroup.add(tail);
`;
}
