import { ColorScheme, DEFAULT_SCHEME } from "../utils/color-utils.js";
import { standaloneHtml, threeImportMap } from "../utils/html-template.js";
import { terrainModel } from "./terrain.js";
import { crystalModel } from "./crystal.js";
import { treeModel } from "./tree.js";
import { abstractSculptureModel } from "./abstract-sculpture.js";
import { lowPolyAnimalModel } from "./low-poly-animal.js";
import { architecturalModel } from "./architectural.js";

export type ModelType =
  | "terrain"
  | "abstract_sculpture"
  | "low_poly_animal"
  | "architectural"
  | "crystal"
  | "tree";

export type ModelStyle = "flat" | "smooth" | "wireframe" | "toon";
export type ModelOutputFormat = "threejs_code" | "gltf_exporter_code" | "standalone_html";

const generators: Record<ModelType, (opts: { complexity: number; style: string; colors: ColorScheme; seed: number }) => string> = {
  terrain: terrainModel,
  crystal: crystalModel,
  tree: treeModel,
  abstract_sculpture: abstractSculptureModel,
  low_poly_animal: lowPolyAnimalModel,
  architectural: architecturalModel,
};

export function generateModel(
  modelType: ModelType,
  complexity: number = 0.5,
  colors: Partial<ColorScheme> = {},
  style: ModelStyle = "flat",
  seed: number = 42,
  outputFormat: ModelOutputFormat = "threejs_code"
): string {
  const scheme: ColorScheme = { ...DEFAULT_SCHEME, ...colors };
  const gen = generators[modelType];
  if (!gen) throw new Error(`Unknown model type: ${modelType}`);

  const modelCode = gen({ complexity, style, colors: scheme, seed });

  if (outputFormat === "threejs_code") {
    return `import * as THREE from 'three';\n\n${modelCode}`;
  }

  if (outputFormat === "gltf_exporter_code") {
    const groupName = getGroupName(modelType);
    return `import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

${modelCode}

// Export to GLTF
const exporter = new GLTFExporter();
exporter.parse(${groupName}, (gltf) => {
  const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '${modelType}.gltf';
  a.click();
  URL.revokeObjectURL(url);
}, (error) => console.error(error), { binary: false });`;
  }

  // standalone_html
  const groupName = getGroupName(modelType);
  const sceneCode = `
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color("${scheme.background}");
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 6, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
scene.add(new THREE.AmbientLight(0x404040, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);
const pointLight = new THREE.PointLight("${scheme.accent}", 1.5, 20);
pointLight.position.set(-3, 5, -3);
scene.add(pointLight);

// Grid
const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
scene.add(grid);

${modelCode}

scene.add(${groupName});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`;

  return standaloneHtml({
    title: `${modelType} - 3D Model`,
    importMap: {
      ...threeImportMap(),
    },
    moduleScript: sceneCode,
  });
}

function getGroupName(modelType: ModelType): string {
  const names: Record<ModelType, string> = {
    terrain: "terrainGroup",
    crystal: "crystalGroup",
    tree: "treeGroup",
    abstract_sculpture: "sculptureGroup",
    low_poly_animal: "animalGroup",
    architectural: "archGroup",
  };
  return names[modelType];
}

// Re-export for internal use by animation tool
export { generators as modelGenerators };
