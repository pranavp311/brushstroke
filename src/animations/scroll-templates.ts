import { ColorScheme, DEFAULT_SCHEME } from "../utils/color-utils.js";
import { standaloneHtml, CDN, threeImportMap } from "../utils/html-template.js";
import { modelGenerators, ModelType } from "../models/index.js";

export interface ScrollSection {
  id: string;
  duration: number;
  animation: {
    target?: string;
    rotation?: { x?: number; y?: number; z?: number };
    position?: { x?: number; y?: number; z?: number };
    scale?: number;
    cameraPosition?: { x?: number; y?: number; z?: number };
    ease?: string;
  };
}

export type ModelSource =
  | { type: "file"; path: string }
  | { type: "generate"; modelType: ModelType; modelOptions?: { complexity?: number; style?: string; seed?: number } }
  | { type: "none" };

export type AnimationOutputFormat = "standalone_html" | "module_js";

export function generateScrollAnimation(
  modelSource: ModelSource,
  sections: ScrollSection[],
  colors: Partial<ColorScheme> = {},
  outputFormat: AnimationOutputFormat = "standalone_html"
): string {
  const scheme: ColorScheme = { ...DEFAULT_SCHEME, ...colors };

  const modelSetup = getModelSetup(modelSource, scheme);
  const sectionsDef = JSON.stringify(sections, null, 2);
  const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);

  const code = `
import * as THREE from 'three';
${modelSource.type === "file" ? `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';` : ""}

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color("${scheme.background}");
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 3, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const canvas = renderer.domElement;
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.zIndex = '-1';
document.body.appendChild(canvas);

// Lighting
scene.add(new THREE.AmbientLight(0x404040, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Model
let model;
${modelSetup}

// Scroll sections
const scrollContainer = document.getElementById('scroll-container');
const sections = ${sectionsDef};
const totalScrollHeight = ${totalDuration} * window.innerHeight;
scrollContainer.style.height = totalScrollHeight + 'px';

// Progress bar
const progressBar = document.getElementById('progress-bar');

// Scroll animation
function getScrollProgress() {
  return window.scrollY / (totalScrollHeight - window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if (!model) { renderer.render(scene, camera); return; }

  const progress = getScrollProgress();
  progressBar.style.width = (progress * 100) + '%';

  // Find current section
  let accumulated = 0;
  for (const section of sections) {
    const sectionStart = accumulated / ${totalDuration};
    const sectionEnd = (accumulated + section.duration) / ${totalDuration};

    if (progress >= sectionStart && progress <= sectionEnd) {
      const localProgress = (progress - sectionStart) / (sectionEnd - sectionStart);
      const t = localProgress; // Could apply easing here

      const anim = section.animation;
      if (anim.rotation) {
        if (anim.rotation.x !== undefined) model.rotation.x = anim.rotation.x * t;
        if (anim.rotation.y !== undefined) model.rotation.y = anim.rotation.y * t;
        if (anim.rotation.z !== undefined) model.rotation.z = anim.rotation.z * t;
      }
      if (anim.position) {
        if (anim.position.x !== undefined) model.position.x = anim.position.x * t;
        if (anim.position.y !== undefined) model.position.y = anim.position.y * t;
        if (anim.position.z !== undefined) model.position.z = anim.position.z * t;
      }
      if (anim.scale !== undefined) {
        const s = 1 + (anim.scale - 1) * t;
        model.scale.setScalar(s);
      }
      if (anim.cameraPosition) {
        if (anim.cameraPosition.x !== undefined) camera.position.x = 5 + anim.cameraPosition.x * t;
        if (anim.cameraPosition.y !== undefined) camera.position.y = 3 + anim.cameraPosition.y * t;
        if (anim.cameraPosition.z !== undefined) camera.position.z = 8 + anim.cameraPosition.z * t;
        camera.lookAt(model.position);
      }
    }
    accumulated += section.duration;
  }

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`;

  if (outputFormat === "module_js") {
    return code;
  }

  // standalone_html
  return standaloneHtml({
    title: "Scroll Animation",
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

function getModelSetup(source: ModelSource, colors: ColorScheme): string {
  if (source.type === "file") {
    return `
const loader = new GLTFLoader();
loader.load('${source.path}', (gltf) => {
  model = gltf.scene;
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
    };
    const groupName = {
      terrain: "terrainGroup",
      crystal: "crystalGroup",
      tree: "treeGroup",
      abstract_sculpture: "sculptureGroup",
      low_poly_animal: "animalGroup",
      architectural: "archGroup",
    }[source.modelType];

    return `
${gen(opts)}
model = ${groupName};
scene.add(model);`;
  }

  // type: "none" — default torus knot
  return `
const geometry = new THREE.TorusKnotGeometry(2, 0.6, 128, 32);
const material = new THREE.MeshStandardMaterial({
  color: "${colors.primary}",
  metalness: 0.3,
  roughness: 0.4,
});
model = new THREE.Mesh(geometry, material);
scene.add(model);`;
}
