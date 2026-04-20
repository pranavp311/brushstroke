import { ColorScheme, DEFAULT_SCHEME } from "../utils/color-utils.js";
import { standaloneHtml, threeImportMap } from "../utils/html-template.js";
import { terrainModel } from "./terrain.js";
import { crystalModel } from "./crystal.js";
import { treeModel } from "./tree.js";
import { abstractSculptureModel } from "./abstract-sculpture.js";
import { lowPolyAnimalModel } from "./low-poly-animal.js";
import { architecturalModel } from "./architectural.js";
import { productModel, ProductOptions } from "./product.js";
import { tubeModel, torusModel, helixModel, TubeOptions } from "./tube.js";
import { colorSchemeToTokens } from "../utils/design-tokens.js";
import { generatePbrSceneSetup, generateAutoScale, pbrImports, generateResizeHandler } from "../utils/three-scene.js";

export type ModelType =
  | "terrain"
  | "abstract_sculpture"
  | "low_poly_animal"
  | "architectural"
  | "crystal"
  | "tree"
  | "product"
  | "tube"
  | "torus"
  | "helix";

export type { ProductOptions } from "./product.js";
export type { TubeOptions } from "./tube.js";

export type ModelStyle = "flat" | "smooth" | "wireframe" | "toon" | "dna_helix" | "voxel" | "hologram" | "neon_wire" | "glitch" | "particle_cloud";
export type ModelOutputFormat = "threejs_code" | "gltf_exporter_code" | "standalone_html";

const generators: Record<ModelType, (opts: { complexity: number; style: string; colors: ColorScheme; seed: number; productOptions?: ProductOptions; tubeOptions?: TubeOptions }) => string> = {
  terrain: terrainModel,
  crystal: crystalModel,
  tree: treeModel,
  abstract_sculpture: abstractSculptureModel,
  low_poly_animal: lowPolyAnimalModel,
  architectural: architecturalModel,
  product: productModel,
  tube: tubeModel,
  torus: torusModel,
  helix: helixModel,
};

export function generateModel(
  modelType: ModelType,
  complexity: number = 0.5,
  colors: Partial<ColorScheme> = {},
  style: ModelStyle = "flat",
  seed: number = 42,
  outputFormat: ModelOutputFormat = "threejs_code",
  productOptions?: ProductOptions,
  tubeOptions?: TubeOptions
): string {
  const scheme: ColorScheme = { ...DEFAULT_SCHEME, ...colors };
  const gen = generators[modelType];
  if (!gen) throw new Error(`Unknown model type: ${modelType}`);

  const modelCode = gen({ complexity, style, colors: scheme, seed, productOptions, tubeOptions });

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
  const tokens = colorSchemeToTokens(colors);
  const sceneCode = `
${pbrImports()}
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

${generatePbrSceneSetup(tokens, {
  cameraPosition: { x: 5, y: 4, z: 6 },
  cameraFov: 50,
  enableShadows: true,
  appendToBody: true,
})}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Grid
const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
scene.add(grid);

${modelCode}

scene.add(${groupName});
${generateAutoScale(groupName)}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

${generateResizeHandler()}`;

  return standaloneHtml({
    title: `${modelType} - 3D Model`,
    backgroundColor: scheme.background,
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
    product: "productGroup",
    tube: "tubeGroup",
    torus: "torusGroup",
    helix: "helixGroup",
  };
  return names[modelType];
}

// Re-export for internal use by animation tool
export { generators as modelGenerators };
