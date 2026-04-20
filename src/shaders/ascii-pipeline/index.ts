/**
 * Multi-pass ASCII pipeline orchestrator.
 * Generates complete Three.js code with FBO chain for image/video-to-ASCII conversion.
 * Inspired by AcerolaFX's ASCII shader, adapted for WebGL2.
 */

import { fullscreenVertex, luminanceDoGPass, sobelDirectionPass, asciiRenderPass, colorCompositePass } from "./passes.js";
import { standaloneHtml, threeImportMap } from "../../utils/html-template.js";
import { hexToRgbArray } from "../../utils/color-utils.js";

export interface AsciiPipelineOptions {
  charSize: number;
  exposure: number;
  attenuation: number;
  edgeSensitivity: number;
  colorMode: "mono" | "color" | "custom";
  foregroundColor: string;
  backgroundColor: string;
  invert: boolean;
  colorBlend: number;
}

/**
 * Generate the full 4-pass ASCII pipeline as Three.js module code.
 * The returned code expects a `sourceTexture` variable to already exist.
 */
export function generateAsciiPipelineCode(opts: AsciiPipelineOptions): string {
  const fgRgb = hexToRgbArray(opts.foregroundColor);
  const bgRgb = hexToRgbArray(opts.backgroundColor);

  const pass1Frag = luminanceDoGPass(opts.exposure, opts.attenuation);
  const pass2Frag = sobelDirectionPass();
  const pass3Frag = asciiRenderPass(opts.charSize, opts.edgeSensitivity);
  const pass4Frag = colorCompositePass(opts.colorMode, opts.invert, opts.colorBlend);

  return `
// === ASCII Multi-Pass Pipeline ===
// 4-pass render-to-texture pipeline (AcerolaFX-inspired)

const asciiVertex = \`${fullscreenVertex}\`;

// Create render targets (FBOs)
const fboSize = new THREE.Vector2(window.innerWidth, window.innerHeight);
const fboA = new THREE.WebGLRenderTarget(fboSize.x, fboSize.y, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
const fboB = new THREE.WebGLRenderTarget(fboSize.x, fboSize.y, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
const fboC = new THREE.WebGLRenderTarget(fboSize.x, fboSize.y, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });

// Fullscreen quad setup
const fsQuadGeo = new THREE.PlaneGeometry(2, 2);
const fsScene = new THREE.Scene();
const fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Pass 1: Luminance + DoG Edge Detection
const pass1Material = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: fboSize.clone() },
  },
  vertexShader: asciiVertex,
  fragmentShader: \`${pass1Frag}\`,
});

// Pass 2: Sobel Direction
const pass2Material = new THREE.ShaderMaterial({
  uniforms: {
    tLumEdge: { value: null },
    uResolution: { value: fboSize.clone() },
  },
  vertexShader: asciiVertex,
  fragmentShader: \`${pass2Frag}\`,
});

// Pass 3: ASCII Render
const pass3Material = new THREE.ShaderMaterial({
  uniforms: {
    tLumEdge: { value: null },
    tSobelDir: { value: null },
    uResolution: { value: fboSize.clone() },
  },
  vertexShader: asciiVertex,
  fragmentShader: \`${pass3Frag}\`,
});

// Pass 4: Color Composite
const pass4Material = new THREE.ShaderMaterial({
  uniforms: {
    tAscii: { value: null },
    tOriginal: { value: null },
    fgColor: { value: new THREE.Vector3(${fgRgb[0].toFixed(4)}, ${fgRgb[1].toFixed(4)}, ${fgRgb[2].toFixed(4)}) },
    bgColor: { value: new THREE.Vector3(${bgRgb[0].toFixed(4)}, ${bgRgb[1].toFixed(4)}, ${bgRgb[2].toFixed(4)}) },
    uResolution: { value: fboSize.clone() },
  },
  vertexShader: asciiVertex,
  fragmentShader: \`${pass4Frag}\`,
});

const fsQuad = new THREE.Mesh(fsQuadGeo, pass1Material);
fsScene.add(fsQuad);

function runAsciiPipeline(inputTexture) {
  // Pass 1: Luminance + DoG
  pass1Material.uniforms.tDiffuse.value = inputTexture;
  fsQuad.material = pass1Material;
  renderer.setRenderTarget(fboA);
  renderer.render(fsScene, fsCamera);

  // Pass 2: Sobel Direction
  pass2Material.uniforms.tLumEdge.value = fboA.texture;
  fsQuad.material = pass2Material;
  renderer.setRenderTarget(fboB);
  renderer.render(fsScene, fsCamera);

  // Pass 3: ASCII Character Rendering
  pass3Material.uniforms.tLumEdge.value = fboA.texture;
  pass3Material.uniforms.tSobelDir.value = fboB.texture;
  fsQuad.material = pass3Material;
  renderer.setRenderTarget(fboC);
  renderer.render(fsScene, fsCamera);

  // Pass 4: Color Composite (render to screen)
  pass4Material.uniforms.tAscii.value = fboC.texture;
  pass4Material.uniforms.tOriginal.value = inputTexture;
  fsQuad.material = pass4Material;
  renderer.setRenderTarget(null);
  renderer.render(fsScene, fsCamera);
}

// Handle resize
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  fboSize.set(w, h);
  fboA.setSize(w, h);
  fboB.setSize(w, h);
  fboC.setSize(w, h);
  [pass1Material, pass2Material, pass3Material, pass4Material].forEach(m => {
    m.uniforms.uResolution.value.set(w, h);
  });
  renderer.setSize(w, h);
});`;
}

/** Generate standalone HTML for image-to-ASCII */
export function generateImageAsciiHtml(source: string, opts: AsciiPipelineOptions): string {
  const pipelineCode = generateAsciiPipelineCode(opts);
  const bgRgb = hexToRgbArray(opts.backgroundColor);

  const moduleScript = `
import * as THREE from 'three';

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1); // ASCII doesn't benefit from high DPI
document.body.appendChild(renderer.domElement);

${pipelineCode}

// Load image
const loader = new THREE.TextureLoader();
loader.load('${source}', (texture) => {
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  runAsciiPipeline(texture);
}, undefined, (err) => {
  console.error('Failed to load image:', err);
});`;

  return standaloneHtml({
    title: "ASCII Art - Image",
    backgroundColor: `rgb(${Math.round(bgRgb[0] * 255)}, ${Math.round(bgRgb[1] * 255)}, ${Math.round(bgRgb[2] * 255)})`,
    importMap: threeImportMap(),
    moduleScript,
  });
}

/** Generate standalone HTML for video-to-ASCII (real-time) */
export function generateVideoAsciiHtml(source: string, opts: AsciiPipelineOptions): string {
  const pipelineCode = generateAsciiPipelineCode(opts);
  const bgRgb = hexToRgbArray(opts.backgroundColor);

  const moduleScript = `
import * as THREE from 'three';

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);

${pipelineCode}

// Video element
const video = document.createElement('video');
video.src = '${source}';
video.crossOrigin = 'anonymous';
video.loop = true;
video.muted = true;
video.playsInline = true;
video.style.display = 'none';
document.body.appendChild(video);

const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;

video.addEventListener('canplaythrough', () => {
  video.play();
});

function animate() {
  requestAnimationFrame(animate);
  if (video.readyState >= video.HAVE_CURRENT_DATA) {
    videoTexture.needsUpdate = true;
    runAsciiPipeline(videoTexture);
  }
}
animate();`;

  return standaloneHtml({
    title: "ASCII Art - Video",
    backgroundColor: `rgb(${Math.round(bgRgb[0] * 255)}, ${Math.round(bgRgb[1] * 255)}, ${Math.round(bgRgb[2] * 255)})`,
    importMap: threeImportMap(),
    moduleScript,
  });
}

/** Generate pipeline code as Three.js ShaderPass-compatible output */
export function generateAsciiPipelineShaderPass(opts: AsciiPipelineOptions): string {
  return `import * as THREE from 'three';

// ASCII Multi-Pass Pipeline — use with an existing renderer and scene
// Call runAsciiPipeline(texture) to process any texture through the ASCII pipeline

${generateAsciiPipelineCode(opts)}

export { runAsciiPipeline, fboA, fboB, fboC, pass1Material, pass2Material, pass3Material, pass4Material };`;
}
