import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export function architecturalModel(opts: { complexity: number; style: string; colors: ColorScheme; seed: number }): string {
  const floors = Math.floor(3 + opts.complexity * 10);

  return `
// Procedural Architectural Model (seed: ${opts.seed})
const archGroup = new THREE.Group();

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const rng = seededRandom(${opts.seed});

const wallColor = ${hexToThreeColor(opts.colors.primary)};
const accentColor = ${hexToThreeColor(opts.colors.accent)};
const glassColor = ${hexToThreeColor(opts.colors.secondary)};
const matOpts = {
  flatShading: ${opts.style === "flat" ? "true" : "false"},
  wireframe: ${opts.style === "wireframe" ? "true" : "false"},
};

const numFloors = ${floors};
const floorHeight = 1.2;
let currentWidth = 4 + rng() * 2;
let currentDepth = 4 + rng() * 2;

for (let f = 0; f < numFloors; f++) {
  const y = f * floorHeight;

  // Floor slab
  const slabGeo = new THREE.BoxGeometry(currentWidth + 0.3, 0.15, currentDepth + 0.3);
  const slab = new THREE.Mesh(slabGeo, new THREE.MeshStandardMaterial({
    color: wallColor, ...matOpts
  }));
  slab.position.y = y;
  archGroup.add(slab);

  // Walls with windows
  const wallGeo = new THREE.BoxGeometry(currentWidth, floorHeight - 0.15, currentDepth);
  const wallMat = new THREE.MeshStandardMaterial({
    color: wallColor, ...matOpts, transparent: true, opacity: 0.9
  });
  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.position.y = y + floorHeight / 2;
  archGroup.add(walls);

  // Windows on each side
  const windowsPerSide = Math.floor(currentWidth / 1.2);
  for (let w = 0; w < windowsPerSide; w++) {
    const wx = -currentWidth / 2 + 0.6 + w * 1.2;
    const windowGeo = new THREE.PlaneGeometry(0.7, 0.8);

    // Front windows
    const winF = new THREE.Mesh(windowGeo, new THREE.MeshStandardMaterial({
      color: glassColor, emissive: glassColor, emissiveIntensity: 0.3 * rng(), ...matOpts
    }));
    winF.position.set(wx, y + floorHeight / 2, currentDepth / 2 + 0.01);
    archGroup.add(winF);

    // Back windows
    const winB = winF.clone();
    winB.position.z = -currentDepth / 2 - 0.01;
    winB.rotation.y = Math.PI;
    archGroup.add(winB);
  }

  // Gradually taper
  if (rng() > 0.6 && f > 2) {
    currentWidth *= 0.9;
    currentDepth *= 0.9;
  }
}

// Roof feature
const roofY = numFloors * floorHeight;
const roofGeo = new THREE.ConeGeometry(currentWidth * 0.4, 2, 4);
const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({
  color: accentColor, ...matOpts
}));
roof.position.y = roofY + 1;
roof.rotation.y = Math.PI / 4;
archGroup.add(roof);

// Center the building
archGroup.position.y = -numFloors * floorHeight / 2;
`;
}
