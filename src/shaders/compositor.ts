/**
 * Shader Compositing System
 * 
 * Enables layering multiple shader effects with blend modes
 * Uses EffectComposer for multi-pass rendering
 */

import { ShaderType, ShaderOptions, generateShaderCode } from "./index.js";
import { blendModeFunctions, BLEND_MODE_INDICES, BlendMode } from "./blend-modes/index.js";
import { commonVertex } from "./common/vertex.js";

export interface ShaderLayer {
  id: string;
  shaderType: ShaderType;
  blendMode: BlendMode;
  opacity: number;
  target: "fullscreen" | "scene" | "element";
  elementSelector?: string;
  zIndex: number;
  options?: ShaderOptions;
}

export interface ShaderStack {
  layers: ShaderLayer[];
  resolution: [number, number];
  outputFormat?: "three_shaderpass" | "raw_glsl";
}

export interface CompositorOptions {
  enableBloomPass?: boolean;
  bloomStrength?: number;
  bloomThreshold?: number;
  bloomRadius?: number;
  enableTonemapping?: boolean;
  exposure?: number;
  gammaCorrection?: boolean;
}

/**
 * Generates a complete shader stack with multi-pass rendering
 */
export function generateShaderStack(
  stack: ShaderStack,
  options: CompositorOptions = {}
): string {
  const { layers, resolution } = stack;
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  
  // Generate individual shader codes
  const layerShaders = sortedLayers.map(layer => ({
    ...layer,
    code: generateShaderCode(layer.shaderType, layer.options, "three_shaderpass"),
  }));

  // Build the compositor code
  return buildCompositorCode(layerShaders, resolution, options);
}

function buildCompositorCode(
  layers: Array<ShaderLayer & { code: string }>,
  resolution: [number, number],
  options: CompositorOptions
): string {
  const hasBloom = options.enableBloomPass ?? false;
  const hasTonemapping = options.enableTonemapping ?? true;
  
  // Extract shader definitions
  const shaderDefs = layers.map((layer, i) => {
    const shaderName = `${layer.shaderType.replace(/_/g, "")}Shader${i}`;
    const blendModeIndex = BLEND_MODE_INDICES[layer.blendMode];
    
    return {
      ...layer,
      shaderName,
      blendModeIndex,
      uniformsName: `${shaderName}Uniforms`,
    };
  });

  // Generate imports
  const imports = generateImports(hasBloom);
  
  // Generate shader objects
  const shaderObjects = shaderDefs.map(def => `
// ${def.id} - ${def.shaderType}
${extractShaderObject(def.code, def.shaderName)}
const ${def.uniformsName} = ${def.shaderName}.uniforms;
`).join("\n");

  // Generate composer setup
  const composerSetup = generateComposerSetup(hasBloom, hasTonemapping, options);
  
  // Generate layer passes
  const layerPasses = generateLayerPasses(shaderDefs);
  
  // Generate blend shader for final composite
  const blendShader = generateBlendShader(shaderDefs);
  
  // Generate animation loop
  const animationLoop = generateAnimationLoop(shaderDefs, hasBloom);
  
  return `${imports}

${blendModeFunctions}

// Shader definitions
${shaderObjects}

// Blend shader for compositing
${blendShader}

// Setup
${composerSetup}

// Layer passes
${layerPasses}

// Animation
${animationLoop}
`;
}

function generateImports(hasBloom: boolean): string {
  const baseImports = `import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';`;

  if (hasBloom) {
    return `${baseImports}
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';`;
  }
  
  return baseImports;
}

function extractShaderObject(code: string, name: string): string {
  // Extract the shader object from generated code
  const shaderMatch = code.match(/const \w+Shader = \{[\s\S]+?\};/);
  if (shaderMatch) {
    return shaderMatch[0].replace(/const \w+Shader/, `const ${name}`);
  }
  return `const ${name} = { uniforms: {}, vertexShader: "", fragmentShader: "" };`;
}

function generateBlendShader(layers: Array<{ shaderName: string; blendModeIndex: number; opacity: number }>): string {
  const numLayers = layers.length;
  
  const uniformDefs = layers.map((layer, i) => 
    `tLayer${i}: { value: null },`
  ).join("\n  ");
  
  const blendCalls = layers.map((layer, i) => {
    const isFirst = i === 0;
    if (isFirst) {
      return `vec4 result = texture2D(tLayer${i}, vUv);`;
    }
    return `vec4 layer${i} = texture2D(tLayer${i}, vUv);
  result = applyBlend(result, layer${i}, ${layer.blendModeIndex}, ${layer.opacity.toFixed(2)});`;
  }).join("\n  ");

  return `
const BlendCompositorShader = {
  uniforms: {
    ${uniformDefs}
  },
  vertexShader: \`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  \`,
  fragmentShader: \`
    ${blendModeFunctions}
    
    ${layers.map((_, i) => `uniform sampler2D tLayer${i};`).join("\n    ")}
    varying vec2 vUv;
    
    void main() {
      ${blendCalls}
      gl_FragColor = result;
    }
  \`
};
`;
}

function generateComposerSetup(
  hasBloom: boolean, 
  hasTonemapping: boolean,
  options: CompositorOptions
): string {
  const bloomSetup = hasBloom ? `
// Bloom pass
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  ${options.bloomStrength ?? 1.5},
  ${options.bloomRadius ?? 0.4},
  ${options.bloomThreshold ?? 0.7}
);
composer.addPass(bloomPass);` : "";

  return `
// Setup composer
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
${bloomSetup}
`;
}

function generateLayerPasses(layers: Array<{ shaderName: string; uniformsName: string }>): string {
  return layers.map((layer, i) => `
// Pass ${i} - ${layer.shaderName}
const pass${i} = new ShaderPass(${layer.shaderName});
composer.addPass(pass${i});
`).join("");
}

function generateAnimationLoop(
  layers: Array<{ uniformsName: string; shaderType: string }>,
  hasBloom: boolean
): string {
  const uniformUpdates = layers.map((layer, i) => 
    `if (${layer.uniformsName}.uTime) ${layer.uniformsName}.uTime.value = elapsed;`
  ).join("\n  ");

  const renderCall = hasBloom 
    ? "composer.render();"
    : "composer.render();";

  return `
// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const elapsed = clock.getElapsedTime();
  
  // Update shader uniforms
  ${uniformUpdates}
  
  ${renderCall}
}

animate();

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
`;
}

/**
 * Generate a simple two-layer composite for common use cases
 */
export function generateSimpleComposite(
  baseShader: ShaderType,
  overlayShader: ShaderType,
  blendMode: BlendMode = "normal",
  opacity: number = 0.5
): string {
  return generateShaderStack({
    layers: [
      {
        id: "base",
        shaderType: baseShader,
        blendMode: "normal",
        opacity: 1.0,
        target: "fullscreen",
        zIndex: 0,
      },
      {
        id: "overlay",
        shaderType: overlayShader,
        blendMode,
        opacity,
        target: "fullscreen",
        zIndex: 1,
      },
    ],
    resolution: [1920, 1080],
  }, {
    enableBloomPass: true,
    bloomStrength: 0.8,
  });
}
