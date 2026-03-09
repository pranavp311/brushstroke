import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export function crystalModel(opts: { complexity: number; style: string; colors: ColorScheme; seed: number }): string {
  const detail = Math.floor(opts.complexity * 3);

  return `
// Procedural Crystal (seed: ${opts.seed})
const crystalGroup = new THREE.Group();

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const rng = seededRandom(${opts.seed});

// Main crystal body
const baseGeo = new THREE.IcosahedronGeometry(2, ${detail});
const positions = baseGeo.attributes.position;

// Extrude faces outward to create crystal facets
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const y = positions.getY(i);
  const z = positions.getZ(i);
  const len = Math.sqrt(x*x + y*y + z*z);
  const nx = x/len, ny = y/len, nz = z/len;

  // Elongate vertically
  const stretch = 1.0 + Math.abs(ny) * 1.5;
  // Random facet displacement
  const facetNoise = (rng() - 0.5) * 0.3 * ${opts.complexity.toFixed(2)};

  positions.setXYZ(i,
    nx * (2 + facetNoise) * 0.8,
    ny * (2 + facetNoise) * stretch,
    nz * (2 + facetNoise) * 0.8
  );
}
baseGeo.computeVertexNormals();

const crystalMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.primary)},
  metalness: 0.1,
  roughness: 0.05,
  transmission: 0.6,
  thickness: 1.5,
  ior: 2.4,
  flatShading: ${opts.style === "flat" || opts.style === "toon" ? "true" : "false"},
  wireframe: ${opts.style === "wireframe" ? "true" : "false"},
});

const crystal = new THREE.Mesh(baseGeo, crystalMat);
crystalGroup.add(crystal);

// Smaller satellite crystals
const numSatellites = Math.floor(3 + ${opts.complexity} * 5);
for (let i = 0; i < numSatellites; i++) {
  const satGeo = new THREE.IcosahedronGeometry(0.5 + rng() * 0.8, ${Math.max(0, detail - 1)});
  const satPos = satGeo.attributes.position;
  for (let j = 0; j < satPos.count; j++) {
    const sy = satPos.getY(j);
    satPos.setY(j, sy * (1.5 + rng()));
  }
  satGeo.computeVertexNormals();

  const satMat = new THREE.MeshPhysicalMaterial({
    color: ${hexToThreeColor(opts.colors.secondary)},
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.4,
    flatShading: ${opts.style === "flat" ? "true" : "false"},
    wireframe: ${opts.style === "wireframe" ? "true" : "false"},
  });

  const sat = new THREE.Mesh(satGeo, satMat);
  const angle = rng() * Math.PI * 2;
  const radius = 2 + rng() * 2;
  sat.position.set(
    Math.cos(angle) * radius,
    (rng() - 0.3) * 3,
    Math.sin(angle) * radius
  );
  sat.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
  crystalGroup.add(sat);
}

// Inner glow light
const glowLight = new THREE.PointLight("${opts.colors.accent}", 2, 10);
glowLight.position.set(0, 0, 0);
crystalGroup.add(glowLight);
`;
}
