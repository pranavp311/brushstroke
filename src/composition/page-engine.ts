/**
 * Page composition engine — single renderer, single scene, DOM overlay.
 *
 * Architecture:
 * 1. Fixed <canvas> behind scrollable content sections
 * 2. Background = fullscreen quad at z=-100 (scene_element from bg generators)
 * 3. Model loaded once, animated via scroll keyframes
 * 4. Post-processing = single EffectComposer chain
 * 5. Content sections = vanilla HTML positioned relative with z-index: 1
 */

import { DesignTokens, resolveTokens, ThemePreset, tokensToColorScheme } from "../utils/design-tokens.js";
import { EasingName } from "../animations/easings.js";
import { standaloneHtml, threeImportMap } from "../utils/html-template.js";
import { generatePbrSceneSetup, generateAutoScale, pbrImports, generateResizeHandler } from "../utils/three-scene.js";
import { generateScrollController, SectionScrollSpec } from "./scroll-controller.js";
import { generateSectionHtml, generateSectionStyles, SectionType, SectionContent } from "./section-templates.js";
import { modelGenerators, ModelType, ProductOptions } from "../models/index.js";
import { generateBackground, BackgroundPreset } from "../backgrounds/index.js";
import { ColorScheme } from "../utils/color-utils.js";

export interface PageSpec {
  title: string;
  themePreset?: ThemePreset;
  designTokens?: Partial<DesignTokens>;
  background?: {
    preset: BackgroundPreset;
    quality?: "low" | "medium" | "high";
    interactive?: boolean;
  };
  postProcessing?: {
    bloom?: { threshold?: number; strength?: number; radius?: number };
  };
  modelSource?: PageModelSource;
  sections: PageSection[];
  outputFormat?: "standalone_html";
  customElements?: string[];
  sceneExports?: boolean;
  heroImage?: string;
}

export type PageModelSource =
  | { type: "file"; path: string }
  | { type: "generate"; modelType: ModelType; modelOptions?: { complexity?: number; style?: string; seed?: number; productOptions?: ProductOptions } }
  | { type: "none" };

export interface PageSection {
  id: string;
  type: SectionType;
  content: SectionContent;
  scrollAnimation?: {
    rotation?: { x?: number; y?: number; z?: number };
    position?: { x?: number; y?: number; z?: number };
    cameraPosition?: { x?: number; y?: number; z?: number };
    cameraPath?: Array<{ x: number; y: number; z: number }>;
    cameraLookAt?: { x: number; y: number; z: number } | "model" | "next";
    scale?: number;
    ease?: EasingName;
  };
}

export interface GeneratePageResult {
  html: string;
  resolvedSpec: object;
}

export function generatePage(spec: PageSpec): GeneratePageResult {
  const tokens = resolveTokens(spec.themePreset, spec.designTokens);
  const scheme = tokensToColorScheme(tokens);

  // Build HTML sections
  const sectionsHtml = spec.sections
    .map(s => generateSectionHtml(s.id, s.type, s.content, tokens))
    .join("\n\n");

  // Build section styles
  const sectionStyles = generateSectionStyles(tokens);

  // Build scroll controller
  const scrollSpecs: SectionScrollSpec[] = spec.sections.map(s => ({
    id: s.id,
    scrollAnimation: s.scrollAnimation as SectionScrollSpec["scrollAnimation"],
  }));
  const scrollController = generateScrollController(scrollSpecs, tokens, {
    mouseParallax: true,
    backgroundUniformName: spec.background ? "bgMaterial.uniforms" : undefined,
  });

  // Build model setup code
  const modelSetup = getPageModelSetup(spec.modelSource ?? { type: "none" }, scheme);

  // Build background setup code (as scene_element — just the mesh, no renderer)
  const bgSetup = spec.background
    ? generateBackgroundSceneElement(spec.background, scheme)
    : "";

  // Build post-processing setup
  const postProcessing = spec.postProcessing?.bloom
    ? generateBloomSetup(spec.postProcessing.bloom)
    : "";

  const needsBloom = !!spec.postProcessing?.bloom;
  const needsGltf = spec.modelSource?.type === "file";
  const customElementsCode = (spec.customElements ?? []).join("\n\n");
  const sceneExportsCode = spec.sceneExports
    ? `window.__brushstroke = { scene, camera, renderer, model };`
    : "";

  // Hero image CSS
  const heroImageStyle = spec.heroImage
    ? `#${spec.sections[0]?.id ?? "hero"} { background-image: url('${spec.heroImage}'); background-size: cover; background-position: center; }`
    : "";

  const moduleScript = `
${pbrImports()}
${needsGltf ? `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';` : ""}
${needsBloom ? `import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';` : ""}

${generatePbrSceneSetup(tokens, {
  cameraPosition: { x: 0, y: 1.5, z: 5 },
  cameraFov: 50,
  enableShadows: true,
  appendToBody: false,
  canvasStyle: `{ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', zIndex: '0' }`,
})}

document.body.prepend(renderer.domElement);

${bgSetup}

// Model
let model;
${modelSetup}

${customElementsCode}

${sceneExportsCode}

${postProcessing}

${scrollController}

// Scroll reveal with IntersectionObserver
const revealElements = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });
revealElements.forEach(el => observer.observe(el));

// Animation loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  ${spec.background ? `
    // Update background if update function exists
    const scrollProgress = typeof getScrollProgress === 'function' ? getScrollProgress() : 0;
    if (window.updateBackgroundGradient) window.updateBackgroundGradient(elapsed, scrollProgress);
    if (window.updateBackgroundParticles) window.updateBackgroundParticles(elapsed, scrollProgress);
    if (window.updateBackgroundStarfield) window.updateBackgroundStarfield(elapsed, scrollProgress);
    if (window.updateBackgroundAurora) window.updateBackgroundAurora(elapsed, scrollProgress);
    if (window.updateBackgroundWave) window.updateBackgroundWave(elapsed, scrollProgress);
    if (window.updateBackgroundNoiseTerrain) window.updateBackgroundNoiseTerrain(elapsed, scrollProgress);
    if (window.updateBackgroundFloatingGeometry) window.updateBackgroundFloatingGeometry(elapsed, scrollProgress);
    if (window.updateBackgroundMatrixRain) window.updateBackgroundMatrixRain(elapsed, scrollProgress);
  ` : ""}

  updateScroll();

  ${needsBloom ? "composer.render();" : "renderer.render(scene, camera);"}
}
animate();

${generateResizeHandler()}
${needsBloom ? `window.addEventListener('resize', () => {
  composer.setSize(window.innerWidth, window.innerHeight);
});` : ""}
`;

  const html = standaloneHtml({
    title: spec.title,
    backgroundColor: tokens.colors.background,
    styles: `
      body { overflow-y: scroll; overflow-x: hidden; background: ${tokens.colors.background}; }
      ${sectionStyles}
      ${heroImageStyle}
    `,
    bodyContent: sectionsHtml,
    importMap: threeImportMap(),
    moduleScript,
  });

  return {
    html,
    resolvedSpec: { ...spec, designTokens: tokens },
  };
}

function getPageModelSetup(source: PageModelSource, colors: ColorScheme): string {
  if (source.type === "file") {
    return `
const loader = new GLTFLoader();
loader.load('${source.path}', (gltf) => {
  model = gltf.scene;
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.envMapIntensity = 1.0;
      }
    }
  });
  ${generateAutoScale("model")}
  scene.add(model);
}, undefined, (err) => console.error('Failed to load model:', err));`;
  }

  if (source.type === "generate") {
    const gen = modelGenerators[source.modelType];
    if (!gen) throw new Error(`Unknown model type: ${source.modelType}`);
    const opts = {
      complexity: source.modelOptions?.complexity ?? 0.5,
      style: source.modelOptions?.style ?? "smooth",
      colors,
      seed: source.modelOptions?.seed ?? 42,
      productOptions: source.modelOptions?.productOptions,
    };
    const groupName: Record<string, string> = {
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

    return `
${gen(opts)}
model = ${groupName[source.modelType]};
${generateAutoScale("model")}
scene.add(model);`;
  }

  // type: "none"
  return `
const torusGeo = new THREE.TorusKnotGeometry(1.5, 0.5, 128, 32);
const torusMat = new THREE.MeshStandardMaterial({
  color: "${colors.primary}",
  metalness: 0.8,
  roughness: 0.15,
});
model = new THREE.Mesh(torusGeo, torusMat);
model.castShadow = true;
scene.add(model);`;
}

function generateBackgroundSceneElement(
  bgConfig: { preset: BackgroundPreset; quality?: "low" | "medium" | "high"; interactive?: boolean },
  _scheme: ColorScheme
): string {
  // Use the background generator's scene_element format
  return generateBackground(
    bgConfig.preset,
    _scheme,
    bgConfig.quality ?? "medium",
    bgConfig.interactive ?? true,
    "scene_element"
  );
}

function generateBloomSetup(bloom: { threshold?: number; strength?: number; radius?: number }): string {
  const threshold = bloom.threshold ?? 0.7;
  const strength = bloom.strength ?? 1.0;
  const radius = bloom.radius ?? 0.4;

  return `
// Post-processing: Bloom
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  ${strength}, ${radius}, ${threshold}
);
composer.addPass(bloomPass);`;
}
