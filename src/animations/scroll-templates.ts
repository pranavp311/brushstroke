import { ColorScheme, DEFAULT_SCHEME } from "../utils/color-utils.js";
import { standaloneHtml, threeImportMap } from "../utils/html-template.js";
import { modelGenerators, ModelType, ProductOptions } from "../models/index.js";
import { resolveTokens, colorSchemeToTokens } from "../utils/design-tokens.js";
import { generatePbrSceneSetup, generateAutoScale, pbrImports, generateResizeHandler } from "../utils/three-scene.js";

export interface ScrollSection {
  id: string;
  duration: number;
  animation: {
    target?: string;
    rotation?: { x?: number; y?: number; z?: number };
    position?: { x?: number; y?: number; z?: number };
    scale?: number;
    cameraPosition?: { x?: number; y?: number; z?: number };
    cameraPath?: Array<{ x: number; y: number; z: number }>;
    cameraLookAt?: { x: number; y: number; z: number } | "model" | "next";
    ease?: string;
  };
}

export type ModelSource =
  | { type: "file"; path: string }
  | { type: "generate"; modelType: ModelType; modelOptions?: { complexity?: number; style?: string; seed?: number; productOptions?: ProductOptions } }
  | { type: "none" };

export type AnimationOutputFormat = "standalone_html" | "module_js";

export function generateScrollAnimation(
  modelSource: ModelSource,
  sections: ScrollSection[],
  colors: Partial<ColorScheme> = {},
  outputFormat: AnimationOutputFormat = "standalone_html"
): string {
  const scheme: ColorScheme = { ...DEFAULT_SCHEME, ...colors };
  const tokens = colorSchemeToTokens(colors);

  const modelSetup = getModelSetup(modelSource, scheme);
  const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);

  // Build absolute keyframes from sections
  const keyframes = buildKeyframes(sections);
  const keyframesDef = JSON.stringify(keyframes, null, 2);

  const code = `
${pbrImports()}
${modelSource.type === "file" ? `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';` : ""}

${generatePbrSceneSetup(tokens, {
  cameraPosition: { x: 0, y: 1.5, z: 5 },
  cameraFov: 50,
  enableShadows: true,
  appendToBody: true,
  canvasStyle: `{ position: 'fixed', top: '0', left: '0', zIndex: '-1' }`,
})}

// Model
let model;
${modelSetup}

// Keyframe interpolation system
const keyframes = ${keyframesDef};
const totalScrollHeight = ${totalDuration} * window.innerHeight;
const scrollContainer = document.getElementById('scroll-container');
scrollContainer.style.height = totalScrollHeight + 'px';

const progressBar = document.getElementById('progress-bar');

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getScrollProgress() {
  return Math.max(0, Math.min(1, window.scrollY / (totalScrollHeight - window.innerHeight)));
}

function animate() {
  requestAnimationFrame(animate);
  if (!model) { renderer.render(scene, camera); return; }

  const progress = getScrollProgress();
  if (progressBar) progressBar.style.width = (progress * 100) + '%';

  // Find the two bounding keyframes
  let kfIndex = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (progress >= keyframes[i].progress) kfIndex = i;
  }

  const kfA = keyframes[kfIndex];
  const kfB = keyframes[Math.min(kfIndex + 1, keyframes.length - 1)];

  const segmentLength = kfB.progress - kfA.progress;
  const localT = segmentLength > 0
    ? easeInOutCubic(Math.max(0, Math.min(1, (progress - kfA.progress) / segmentLength)))
    : 0;

  // Interpolate all properties
  model.rotation.x = lerp(kfA.rotation.x, kfB.rotation.x, localT);
  model.rotation.y = lerp(kfA.rotation.y, kfB.rotation.y, localT);
  model.rotation.z = lerp(kfA.rotation.z, kfB.rotation.z, localT);

  model.position.x = lerp(kfA.position.x, kfB.position.x, localT);
  model.position.y = lerp(kfA.position.y, kfB.position.y, localT);
  model.position.z = lerp(kfA.position.z, kfB.position.z, localT);

  const s = lerp(kfA.scale, kfB.scale, localT);
  model.scale.setScalar(s);

  camera.position.x = lerp(kfA.camera.x, kfB.camera.x, localT);
  camera.position.y = lerp(kfA.camera.y, kfB.camera.y, localT);
  camera.position.z = lerp(kfA.camera.z, kfB.camera.z, localT);
  camera.lookAt(model.position);

  renderer.render(scene, camera);
}
animate();

${generateResizeHandler()}`;

  if (outputFormat === "module_js") {
    return code;
  }

  return standaloneHtml({
    title: "Scroll Animation",
    backgroundColor: scheme.background,
    styles: `
      body { overflow-y: scroll; background: ${scheme.background}; }
      #scroll-container { position: relative; }
      #progress-bar { position: fixed; top: 0; left: 0; height: 3px; background: ${scheme.accent}; z-index: 10; transition: width 0.1s; }
      .section-label { position: absolute; left: 50%; transform: translateX(-50%); color: white; font-family: system-ui; font-size: 1.5rem; opacity: 0.7; pointer-events: none; }
    `,
    bodyContent: `
      <div id="progress-bar"></div>
      <div id="scroll-container">
        ${sections.map((s, i) => `<div class="section-label" style="top: ${i * (100 / sections.length)}%">${s.id}</div>`).join("\n        ")}
      </div>
    `,
    importMap: {
      ...threeImportMap(),
    },
    moduleScript: code,
  });
}

interface AbsoluteKeyframe {
  progress: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  scale: number;
  camera: { x: number; y: number; z: number };
}

function buildKeyframes(sections: ScrollSection[]): AbsoluteKeyframe[] {
  const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);

  // Initial state at progress 0
  const initial: AbsoluteKeyframe = {
    progress: 0,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 },
    scale: 1,
    camera: { x: 0, y: 1.5, z: 5 },
  };

  const keyframes: AbsoluteKeyframe[] = [initial];
  let accumulated = 0;
  let current = { ...initial };

  for (const section of sections) {
    accumulated += section.duration;
    const progress = accumulated / totalDuration;
    const anim = section.animation;

    // Each section's values are absolute targets (not deltas)
    const kf: AbsoluteKeyframe = {
      progress,
      rotation: {
        x: anim.rotation?.x ?? current.rotation.x,
        y: anim.rotation?.y ?? current.rotation.y,
        z: anim.rotation?.z ?? current.rotation.z,
      },
      position: {
        x: anim.position?.x ?? current.position.x,
        y: anim.position?.y ?? current.position.y,
        z: anim.position?.z ?? current.position.z,
      },
      scale: anim.scale ?? current.scale,
      camera: {
        x: anim.cameraPosition?.x ?? current.camera.x,
        y: anim.cameraPosition?.y ?? current.camera.y,
        z: anim.cameraPosition?.z ?? current.camera.z,
      },
    };

    keyframes.push(kf);
    current = { ...kf };
  }

  return keyframes;
}

function getModelSetup(source: ModelSource, colors: ColorScheme): string {
  if (source.type === "file") {
    return `
const loader = new GLTFLoader();
loader.load('${source.path}', (gltf) => {
  model = gltf.scene;
  ${generateAutoScale("model")}
  scene.add(model);
}, undefined, (err) => console.error('Failed to load model:', err));`;
  }

  if (source.type === "generate") {
    const gen = modelGenerators[source.modelType];
    if (!gen) throw new Error(`Unknown model type: ${source.modelType}`);
    const opts = {
      complexity: source.modelOptions?.complexity ?? 0.5,
      style: source.modelOptions?.style ?? "flat",
      colors,
      seed: source.modelOptions?.seed ?? 42,
      productOptions: source.modelOptions?.productOptions,
    };
    const groupName = {
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
    }[source.modelType];

    return `
${gen(opts)}
model = ${groupName};
${generateAutoScale("model")}
scene.add(model);`;
  }

  // type: "none" — default torus knot
  return `
const geometry = new THREE.TorusKnotGeometry(2, 0.6, 128, 32);
const material = new THREE.MeshStandardMaterial({
  color: "${colors.primary}",
  metalness: 0.7,
  roughness: 0.2,
});
model = new THREE.Mesh(geometry, material);
scene.add(model);`;
}
