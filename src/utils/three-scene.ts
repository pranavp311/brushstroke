/** Shared PBR scene setup for all 3D tools */

import { DesignTokens } from "./design-tokens.js";

/**
 * Generates Three.js boilerplate with proper PBR setup:
 * - ACESFilmicToneMapping + configurable exposure
 * - PMREMGenerator + RoomEnvironment for env maps
 * - Consistent 3-point lighting from design tokens
 * - Resize handler
 */
export function generatePbrSceneSetup(tokens: DesignTokens, options?: {
  cameraPosition?: { x: number; y: number; z: number };
  cameraFov?: number;
  enableShadows?: boolean;
  appendToBody?: boolean;
  canvasStyle?: string;
}): string {
  const camPos = options?.cameraPosition ?? { x: 0, y: 1.5, z: 5 };
  const fov = options?.cameraFov ?? 50;
  const shadows = options?.enableShadows ?? true;
  const appendToBody = options?.appendToBody ?? true;
  const canvasStyle = options?.canvasStyle ?? "";

  return `// PBR Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color("${tokens.colors.background}");

const camera = new THREE.PerspectiveCamera(${fov}, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(${camPos.x}, ${camPos.y}, ${camPos.z});
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = ${tokens.materials.toneMapping};
renderer.toneMappingExposure = ${tokens.materials.toneMappingExposure};
${shadows ? `renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;` : ""}
${canvasStyle ? `Object.assign(renderer.domElement.style, ${canvasStyle});` : ""}
${appendToBody ? "document.body.appendChild(renderer.domElement);" : ""}

// Environment map for PBR reflections (RoomEnvironment — no external HDR needed)
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
const roomEnv = new RoomEnvironment();
const envMap = pmremGenerator.fromScene(roomEnv).texture;
scene.environment = envMap;
roomEnv.dispose();

// 3-point lighting
const ambientLight = new THREE.AmbientLight(0xffffff, ${tokens.lighting.ambientIntensity});
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, ${tokens.lighting.keyIntensity});
keyLight.position.set(5, 8, 5);
${shadows ? `keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 50;` : ""}
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, ${tokens.lighting.keyIntensity * 0.4});
fillLight.position.set(-5, 3, -3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(new THREE.Color("${tokens.colors.accent}"), ${tokens.lighting.keyIntensity * 0.3});
rimLight.position.set(0, 5, -8);
scene.add(rimLight);`;
}

/** Generates a resize handler for the shared scene */
export function generateResizeHandler(): string {
  return `window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`;
}

/** Generates auto-scale code that normalizes a model to fit in a bounding box */
export function generateAutoScale(modelVar: string, targetSize: number = 3): string {
  return `// Auto-scale model to fit
{
  const box = new THREE.Box3().setFromObject(${modelVar});
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const scale = ${targetSize} / maxDim;
    ${modelVar}.scale.multiplyScalar(scale);
  }
  const center = box.getCenter(new THREE.Vector3());
  ${modelVar}.position.sub(center.multiplyScalar(${modelVar}.scale.x));
}`;
}

/** Returns the Three.js imports needed for PBR scene setup */
export function pbrImports(): string {
  return `import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';`;
}
