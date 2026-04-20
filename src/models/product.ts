import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export type ProductPreset =
  | "smartphone"
  | "laptop"
  | "bottle"
  | "shoe"
  | "watch"
  | "headphones"
  | "tablet"
  | "mug";

export interface ProductOptions {
  preset: ProductPreset;
  dimensions?: { width?: number; height?: number; depth?: number };
  features?: Record<string, boolean>;
  materialOverride?: "metallic" | "matte" | "glossy" | "transparent";
}

function getMaterialParams(override?: ProductOptions["materialOverride"]): string {
  switch (override) {
    case "metallic":
      return `metalness: 0.9, roughness: 0.1`;
    case "matte":
      return `metalness: 0.0, roughness: 0.9`;
    case "glossy":
      return `metalness: 0.3, roughness: 0.05, clearcoat: 1.0`;
    case "transparent":
      return `metalness: 0.0, roughness: 0.1, transmission: 0.8, thickness: 0.5, ior: 1.5`;
    default:
      return `metalness: 0.3, roughness: 0.4`;
  }
}

function smartphonePreset(opts: { colors: ColorScheme; style: string; materialOverride?: ProductOptions["materialOverride"]; dimensions?: ProductOptions["dimensions"]; features?: Record<string, boolean> }): string {
  const w = opts.dimensions?.width ?? 0.75;
  const h = opts.dimensions?.height ?? 1.5;
  const d = opts.dimensions?.depth ?? 0.08;
  const showCamera = opts.features?.camera !== false;
  const showButtons = opts.features?.buttons !== false;
  const matParams = getMaterialParams(opts.materialOverride);

  return `
// Smartphone
const productGroup = new THREE.Group();

// Body
const bodyGeo = new THREE.BoxGeometry(${w}, ${h}, ${d}, 1, 1, 1);
const bodyMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.primary)},
  ${matParams},
  flatShading: ${opts.style === "flat" ? "true" : "false"},
  wireframe: ${opts.style === "wireframe" ? "true" : "false"},
});
const body = new THREE.Mesh(bodyGeo, bodyMat);
productGroup.add(body);

// Screen (front face)
const screenGeo = new THREE.PlaneGeometry(${w * 0.9}, ${h * 0.85});
const screenMat = new THREE.MeshPhysicalMaterial({
  color: 0x111111,
  emissive: ${hexToThreeColor(opts.colors.accent)},
  emissiveIntensity: 0.3,
  metalness: 0.0,
  roughness: 0.1,
});
const screen = new THREE.Mesh(screenGeo, screenMat);
screen.position.z = ${d / 2 + 0.001};
productGroup.add(screen);
${showCamera ? `
// Camera
const camGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
const camMat = new THREE.MeshPhysicalMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
const cam = new THREE.Mesh(camGeo, camMat);
cam.rotation.x = Math.PI / 2;
cam.position.set(${w * 0.3}, ${h * 0.4}, ${-d / 2 - 0.01});
productGroup.add(cam);` : ""}
${showButtons ? `
// Side buttons
const btnGeo = new THREE.BoxGeometry(0.02, 0.15, 0.03);
const btnMat = new THREE.MeshPhysicalMaterial({ color: ${hexToThreeColor(opts.colors.secondary)}, metalness: 0.5, roughness: 0.3 });
const volUp = new THREE.Mesh(btnGeo, btnMat);
volUp.position.set(${w / 2 + 0.01}, 0.3, 0);
productGroup.add(volUp);
const volDown = new THREE.Mesh(btnGeo, btnMat);
volDown.position.set(${w / 2 + 0.01}, 0.1, 0);
productGroup.add(volDown);
const pwrGeo = new THREE.BoxGeometry(0.02, 0.2, 0.03);
const pwr = new THREE.Mesh(pwrGeo, btnMat);
pwr.position.set(${-w / 2 - 0.01}, 0.2, 0);
productGroup.add(pwr);` : ""}
`;
}

function laptopPreset(opts: { colors: ColorScheme; style: string; materialOverride?: ProductOptions["materialOverride"]; dimensions?: ProductOptions["dimensions"]; features?: Record<string, boolean> }): string {
  const w = opts.dimensions?.width ?? 3;
  const h = opts.dimensions?.height ?? 0.15;
  const d = opts.dimensions?.depth ?? 2;
  const showKeyboard = opts.features?.keyboard !== false;
  const showTrackpad = opts.features?.trackpad !== false;
  const matParams = getMaterialParams(opts.materialOverride);

  return `
// Laptop
const productGroup = new THREE.Group();

// Base
const baseGeo = new THREE.BoxGeometry(${w}, ${h}, ${d});
const baseMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.primary)},
  ${matParams},
  flatShading: ${opts.style === "flat" ? "true" : "false"},
  wireframe: ${opts.style === "wireframe" ? "true" : "false"},
});
const base = new THREE.Mesh(baseGeo, baseMat);
productGroup.add(base);

// Screen lid
const lidGeo = new THREE.BoxGeometry(${w}, ${d * 0.95}, ${h * 0.6});
const lid = new THREE.Mesh(lidGeo, baseMat);
lid.position.set(0, ${d * 0.95 / 2}, ${-d / 2});
productGroup.add(lid);

// Screen surface
const scrGeo = new THREE.PlaneGeometry(${w * 0.9}, ${d * 0.8});
const scrMat = new THREE.MeshPhysicalMaterial({
  color: 0x111111,
  emissive: ${hexToThreeColor(opts.colors.accent)},
  emissiveIntensity: 0.2,
  metalness: 0.0,
  roughness: 0.1,
});
const scr = new THREE.Mesh(scrGeo, scrMat);
scr.position.set(0, ${d * 0.95 / 2}, ${-d / 2 + h * 0.3 + 0.001});
productGroup.add(scr);
${showKeyboard ? `
// Keyboard (grid of small boxes)
const keyMat = new THREE.MeshPhysicalMaterial({ color: ${hexToThreeColor(opts.colors.secondary)}, metalness: 0.2, roughness: 0.6 });
for (let row = 0; row < 5; row++) {
  for (let col = 0; col < 12; col++) {
    const keyGeo = new THREE.BoxGeometry(0.18, 0.02, 0.16);
    const key = new THREE.Mesh(keyGeo, keyMat);
    key.position.set(
      ${-w * 0.4} + col * 0.22,
      ${h / 2 + 0.01},
      ${-d * 0.15} + row * 0.2
    );
    productGroup.add(key);
  }
}` : ""}
${showTrackpad ? `
// Trackpad
const tpGeo = new THREE.PlaneGeometry(${w * 0.25}, ${d * 0.2});
const tpMat = new THREE.MeshPhysicalMaterial({ color: ${hexToThreeColor(opts.colors.secondary)}, metalness: 0.1, roughness: 0.3 });
const tp = new THREE.Mesh(tpGeo, tpMat);
tp.rotation.x = -Math.PI / 2;
tp.position.set(0, ${h / 2 + 0.001}, ${d * 0.3});
productGroup.add(tp);` : ""}
`;
}

function bottlePreset(opts: { colors: ColorScheme; style: string; materialOverride?: ProductOptions["materialOverride"]; dimensions?: ProductOptions["dimensions"]; features?: Record<string, boolean> }): string {
  const w = opts.dimensions?.width ?? 0.5;
  const h = opts.dimensions?.height ?? 2.5;
  const showLabel = opts.features?.label !== false;
  const showCap = opts.features?.cap !== false;
  const matParams = getMaterialParams(opts.materialOverride ?? "transparent");

  return `
// Bottle (LatheGeometry)
const productGroup = new THREE.Group();

// Profile curve
const points = [];
const radius = ${w};
const height = ${h};
points.push(new THREE.Vector2(0, 0));
points.push(new THREE.Vector2(radius, 0));
points.push(new THREE.Vector2(radius, height * 0.6));
points.push(new THREE.Vector2(radius * 0.7, height * 0.7));
points.push(new THREE.Vector2(radius * 0.35, height * 0.8));
points.push(new THREE.Vector2(radius * 0.3, height * 0.95));
points.push(new THREE.Vector2(radius * 0.32, height));
points.push(new THREE.Vector2(0, height));

const bottleGeo = new THREE.LatheGeometry(points, 32);
const bottleMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.primary)},
  ${matParams},
  flatShading: ${opts.style === "flat" ? "true" : "false"},
  wireframe: ${opts.style === "wireframe" ? "true" : "false"},
});
const bottle = new THREE.Mesh(bottleGeo, bottleMat);
bottle.position.y = -${h / 2};
productGroup.add(bottle);
${showCap ? `
// Cap
const capGeo = new THREE.CylinderGeometry(${w * 0.35}, ${w * 0.35}, ${h * 0.08}, 16);
const capMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.secondary)},
  metalness: 0.6,
  roughness: 0.3,
});
const cap = new THREE.Mesh(capGeo, capMat);
cap.position.y = ${h / 2 + h * 0.04};
productGroup.add(cap);` : ""}
${showLabel ? `
// Label band
const labelGeo = new THREE.CylinderGeometry(${w + 0.01}, ${w + 0.01}, ${h * 0.2}, 32, 1, true);
const labelMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.accent)},
  metalness: 0.0,
  roughness: 0.8,
  side: THREE.DoubleSide,
});
const label = new THREE.Mesh(labelGeo, labelMat);
label.position.y = ${-h * 0.1};
productGroup.add(label);` : ""}
`;
}

function shoePreset(opts: { colors: ColorScheme; style: string; materialOverride?: ProductOptions["materialOverride"]; dimensions?: ProductOptions["dimensions"]; features?: Record<string, boolean> }): string {
  const w = opts.dimensions?.width ?? 1;
  const h = opts.dimensions?.height ?? 0.8;
  const d = opts.dimensions?.depth ?? 2.5;
  const showLaces = opts.features?.laces !== false;
  const matParams = getMaterialParams(opts.materialOverride);

  return `
// Shoe
const productGroup = new THREE.Group();

// Sole
const soleGeo = new THREE.BoxGeometry(${w}, 0.15, ${d});
const soleMat = new THREE.MeshPhysicalMaterial({
  color: 0x222222,
  metalness: 0.0,
  roughness: 0.9,
  flatShading: ${opts.style === "flat" ? "true" : "false"},
  wireframe: ${opts.style === "wireframe" ? "true" : "false"},
});
const sole = new THREE.Mesh(soleGeo, soleMat);
productGroup.add(sole);

// Upper (scaled sphere)
const upperGeo = new THREE.SphereGeometry(${w * 0.5}, 24, 16);
const upperMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.primary)},
  ${matParams},
  flatShading: ${opts.style === "flat" ? "true" : "false"},
  wireframe: ${opts.style === "wireframe" ? "true" : "false"},
});
const upper = new THREE.Mesh(upperGeo, upperMat);
upper.scale.set(1, ${h / (w * 0.5)}, ${d / w * 0.8});
upper.position.y = ${h * 0.4};
upper.position.z = ${-d * 0.1};
productGroup.add(upper);

// Toe cap
const toeGeo = new THREE.SphereGeometry(${w * 0.45}, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
const toeMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.secondary)},
  ${matParams},
});
const toe = new THREE.Mesh(toeGeo, toeMat);
toe.rotation.x = Math.PI / 2;
toe.position.set(0, 0.15, ${d * 0.4});
toe.scale.set(1, 1, 1.3);
productGroup.add(toe);
${showLaces ? `
// Lace holes
const laceHoleMat = new THREE.MeshPhysicalMaterial({ color: ${hexToThreeColor(opts.colors.accent)}, metalness: 0.8, roughness: 0.2 });
for (let i = 0; i < 5; i++) {
  const holeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8);
  const holeL = new THREE.Mesh(holeGeo, laceHoleMat);
  holeL.position.set(${-w * 0.25}, ${h * 0.5} + i * 0.05, ${-d * 0.05} + i * 0.12);
  holeL.rotation.z = Math.PI / 2;
  productGroup.add(holeL);
  const holeR = new THREE.Mesh(holeGeo, laceHoleMat);
  holeR.position.set(${w * 0.25}, ${h * 0.5} + i * 0.05, ${-d * 0.05} + i * 0.12);
  holeR.rotation.z = Math.PI / 2;
  productGroup.add(holeR);
}` : ""}
`;
}

function watchPreset(opts: { colors: ColorScheme; style: string; materialOverride?: ProductOptions["materialOverride"]; dimensions?: ProductOptions["dimensions"]; features?: Record<string, boolean> }): string {
  const w = opts.dimensions?.width ?? 1.2;
  const h = opts.dimensions?.height ?? 0.3;
  const showMarkers = opts.features?.markers !== false;
  const showStraps = opts.features?.straps !== false;
  const matParams = getMaterialParams(opts.materialOverride ?? "metallic");

  return `
// Watch
const productGroup = new THREE.Group();

// Watch face
const faceGeo = new THREE.CylinderGeometry(${w / 2}, ${w / 2}, ${h}, 32);
const faceMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.primary)},
  ${matParams},
  flatShading: ${opts.style === "flat" ? "true" : "false"},
  wireframe: ${opts.style === "wireframe" ? "true" : "false"},
});
const face = new THREE.Mesh(faceGeo, faceMat);
productGroup.add(face);

// Bezel
const bezelGeo = new THREE.TorusGeometry(${w / 2}, ${h * 0.25}, 8, 32);
const bezelMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.secondary)},
  metalness: 0.9,
  roughness: 0.1,
});
const bezel = new THREE.Mesh(bezelGeo, bezelMat);
bezel.rotation.x = Math.PI / 2;
bezel.position.y = ${h / 2};
productGroup.add(bezel);

// Dial face
const dialGeo = new THREE.CircleGeometry(${w / 2 - 0.05}, 32);
const dialMat = new THREE.MeshPhysicalMaterial({
  color: 0x111111,
  emissive: ${hexToThreeColor(opts.colors.accent)},
  emissiveIntensity: 0.15,
});
const dial = new THREE.Mesh(dialGeo, dialMat);
dial.rotation.x = -Math.PI / 2;
dial.position.y = ${h / 2 + 0.01};
productGroup.add(dial);
${showMarkers ? `
// Hour markers
const markerMat = new THREE.MeshPhysicalMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
for (let i = 0; i < 12; i++) {
  const mGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 6);
  const marker = new THREE.Mesh(mGeo, markerMat);
  const angle = (i / 12) * Math.PI * 2;
  marker.position.set(
    Math.cos(angle) * ${w / 2 - 0.12},
    ${h / 2 + 0.01},
    Math.sin(angle) * ${w / 2 - 0.12}
  );
  marker.rotation.z = Math.PI / 2;
  productGroup.add(marker);
}` : ""}
${showStraps ? `
// Straps
const strapMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.primary)},
  metalness: 0.0,
  roughness: 0.8,
});
const strapGeo = new THREE.BoxGeometry(${w * 0.5}, 0.08, ${w * 1.5});
const strapTop = new THREE.Mesh(strapGeo, strapMat);
strapTop.position.set(0, 0, ${-w * 0.75 - w / 2});
productGroup.add(strapTop);
const strapBot = new THREE.Mesh(strapGeo, strapMat);
strapBot.position.set(0, 0, ${w * 0.75 + w / 2});
productGroup.add(strapBot);` : ""}
`;
}

function headphonesPreset(opts: { colors: ColorScheme; style: string; materialOverride?: ProductOptions["materialOverride"]; dimensions?: ProductOptions["dimensions"]; features?: Record<string, boolean> }): string {
  const w = opts.dimensions?.width ?? 1.8;
  const h = opts.dimensions?.height ?? 2;
  const showCushions = opts.features?.cushions !== false;
  const matParams = getMaterialParams(opts.materialOverride);

  return `
// Headphones
const productGroup = new THREE.Group();

const cupMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.primary)},
  ${matParams},
  flatShading: ${opts.style === "flat" ? "true" : "false"},
  wireframe: ${opts.style === "wireframe" ? "true" : "false"},
});

// Left cup
const cupGeoL = new THREE.SphereGeometry(0.5, 24, 16);
const cupL = new THREE.Mesh(cupGeoL, cupMat);
cupL.scale.set(1, 1, 0.6);
cupL.position.set(${-w / 2}, 0, 0);
productGroup.add(cupL);

// Right cup
const cupR = new THREE.Mesh(cupGeoL, cupMat);
cupR.scale.set(1, 1, 0.6);
cupR.position.set(${w / 2}, 0, 0);
productGroup.add(cupR);

// Headband arc (TubeGeometry with CatmullRomCurve3)
const arcPoints = [];
for (let i = 0; i <= 20; i++) {
  const t = i / 20;
  const angle = Math.PI * t;
  arcPoints.push(new THREE.Vector3(
    Math.cos(angle) * ${w / 2},
    Math.sin(angle) * ${h * 0.5} + 0.3,
    0
  ));
}
const arcCurve = new THREE.CatmullRomCurve3(arcPoints);
const arcGeo = new THREE.TubeGeometry(arcCurve, 32, 0.06, 8, false);
const arcMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.secondary)},
  metalness: 0.5,
  roughness: 0.3,
});
const arc = new THREE.Mesh(arcGeo, arcMat);
productGroup.add(arc);
${showCushions ? `
// Ear cushions
const cushionMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.secondary)},
  metalness: 0.0,
  roughness: 0.9,
});
const cushionGeo = new THREE.TorusGeometry(0.35, 0.12, 8, 24);
const cushionL = new THREE.Mesh(cushionGeo, cushionMat);
cushionL.position.set(${-w / 2}, 0, -0.05);
productGroup.add(cushionL);
const cushionR = new THREE.Mesh(cushionGeo, cushionMat);
cushionR.position.set(${w / 2}, 0, -0.05);
productGroup.add(cushionR);` : ""}
`;
}

function tabletPreset(opts: { colors: ColorScheme; style: string; materialOverride?: ProductOptions["materialOverride"]; dimensions?: ProductOptions["dimensions"]; features?: Record<string, boolean> }): string {
  const w = opts.dimensions?.width ?? 1.8;
  const h = opts.dimensions?.height ?? 2.4;
  const d = opts.dimensions?.depth ?? 0.06;
  const showCamera = opts.features?.camera !== false;
  const matParams = getMaterialParams(opts.materialOverride);

  return `
// Tablet
const productGroup = new THREE.Group();

// Body
const bodyGeo = new THREE.BoxGeometry(${w}, ${h}, ${d});
const bodyMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.primary)},
  ${matParams},
  flatShading: ${opts.style === "flat" ? "true" : "false"},
  wireframe: ${opts.style === "wireframe" ? "true" : "false"},
});
const body = new THREE.Mesh(bodyGeo, bodyMat);
productGroup.add(body);

// Screen
const screenGeo = new THREE.PlaneGeometry(${w * 0.92}, ${h * 0.92});
const screenMat = new THREE.MeshPhysicalMaterial({
  color: 0x111111,
  emissive: ${hexToThreeColor(opts.colors.accent)},
  emissiveIntensity: 0.25,
  metalness: 0.0,
  roughness: 0.1,
});
const screen = new THREE.Mesh(screenGeo, screenMat);
screen.position.z = ${d / 2 + 0.001};
productGroup.add(screen);
${showCamera ? `
// Camera
const camGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.015, 16);
const camMat = new THREE.MeshPhysicalMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
const cam = new THREE.Mesh(camGeo, camMat);
cam.rotation.x = Math.PI / 2;
cam.position.set(0, ${h * 0.43}, ${-d / 2 - 0.008});
productGroup.add(cam);` : ""}
`;
}

function mugPreset(opts: { colors: ColorScheme; style: string; materialOverride?: ProductOptions["materialOverride"]; dimensions?: ProductOptions["dimensions"]; features?: Record<string, boolean> }): string {
  const w = opts.dimensions?.width ?? 0.8;
  const h = opts.dimensions?.height ?? 1.2;
  const showHandle = opts.features?.handle !== false;
  const matParams = getMaterialParams(opts.materialOverride ?? "glossy");

  return `
// Mug
const productGroup = new THREE.Group();

// Body (open-top cylinder)
const bodyGeo = new THREE.CylinderGeometry(${w / 2}, ${w / 2 * 0.9}, ${h}, 32, 1, true);
const bodyMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.primary)},
  ${matParams},
  side: THREE.DoubleSide,
  flatShading: ${opts.style === "flat" ? "true" : "false"},
  wireframe: ${opts.style === "wireframe" ? "true" : "false"},
});
const body = new THREE.Mesh(bodyGeo, bodyMat);
productGroup.add(body);

// Bottom disc
const bottomGeo = new THREE.CircleGeometry(${w / 2 * 0.9}, 32);
const bottom = new THREE.Mesh(bottomGeo, bodyMat);
bottom.rotation.x = Math.PI / 2;
bottom.position.y = ${-h / 2};
productGroup.add(bottom);

// Rim
const rimGeo = new THREE.TorusGeometry(${w / 2}, 0.02, 8, 32);
const rimMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.secondary)},
  metalness: 0.3,
  roughness: 0.4,
});
const rim = new THREE.Mesh(rimGeo, rimMat);
rim.rotation.x = Math.PI / 2;
rim.position.y = ${h / 2};
productGroup.add(rim);
${showHandle ? `
// Handle (half torus)
const handleGeo = new THREE.TorusGeometry(${h * 0.25}, 0.05, 8, 16, Math.PI);
const handleMat = new THREE.MeshPhysicalMaterial({
  color: ${hexToThreeColor(opts.colors.primary)},
  ${matParams},
});
const handle = new THREE.Mesh(handleGeo, handleMat);
handle.rotation.y = Math.PI / 2;
handle.position.set(${w / 2 + h * 0.25 - 0.02}, 0, 0);
productGroup.add(handle);` : ""}
`;
}

const presetGenerators: Record<ProductPreset, (opts: { colors: ColorScheme; style: string; materialOverride?: ProductOptions["materialOverride"]; dimensions?: ProductOptions["dimensions"]; features?: Record<string, boolean> }) => string> = {
  smartphone: smartphonePreset,
  laptop: laptopPreset,
  bottle: bottlePreset,
  shoe: shoePreset,
  watch: watchPreset,
  headphones: headphonesPreset,
  tablet: tabletPreset,
  mug: mugPreset,
};

export function productModel(opts: { complexity: number; style: string; colors: ColorScheme; seed: number; productOptions?: ProductOptions }): string {
  const productOpts = opts.productOptions;
  if (!productOpts) throw new Error("productOptions is required for product model type");
  const gen = presetGenerators[productOpts.preset];
  if (!gen) throw new Error(`Unknown product preset: ${productOpts.preset}`);
  return gen({
    colors: opts.colors,
    style: opts.style,
    materialOverride: productOpts.materialOverride,
    dimensions: productOpts.dimensions,
    features: productOpts.features,
  });
}
