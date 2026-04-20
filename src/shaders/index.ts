import { commonVertex } from "./common/vertex.js";
import { crtFragment } from "./crt/fragment.js";
import { bloomBrightPassFragment, bloomBlurFragment, bloomCompositeFragment } from "./bloom/fragment.js";
import { asciiFragment } from "./ascii/fragment.js";
import { kuwaharaFragment } from "./kuwahara/fragment.js";
import { halftoneFragment } from "./halftone/fragment.js";
import { ditheringFragment } from "./dithering/fragment.js";
import { edgeDetectionFragment } from "./edge-detection/fragment.js";
import { pixelSortFragment } from "./pixel-sort/fragment.js";
import { chromaticAberrationFragment } from "./chromatic-aberration/fragment.js";
import { filmGrainFragment } from "./film-grain/fragment.js";
import { hologramFragment } from "./hologram/fragment.js";
import { hexToVec3 } from "../utils/color-utils.js";

export type ShaderType =
  | "ascii"
  | "kuwahara"
  | "halftone"
  | "crt"
  | "bloom"
  | "dithering"
  | "edge_detection"
  | "pixel_sort"
  | "chromatic_aberration"
  | "film_grain"
  | "hologram";

export interface ShaderOptions {
  intensity?: number;
  resolution?: [number, number];
  // CRT
  scanlineIntensity?: number;
  curvature?: number;
  vignetteStrength?: number;
  chromaticAberration?: number;
  // Bloom
  threshold?: number;
  blurRadius?: number;
  bloomIntensity?: number;
  // ASCII
  charSize?: number;
  edgeThreshold?: number;
  colorMode?: "mono" | "color";
  // Kuwahara
  radius?: number;
  sharpness?: number;
  // Halftone
  dotSize?: number;
  spread?: number;
  cmyk?: boolean;
  // Dithering
  ditheringMethod?: "bayer" | "blue_noise";
  levels?: number;
  colorize?: boolean;
  // Edge Detection
  edgeMethod?: "sobel" | "roberts" | "prewitt";
  lineColor?: string;
  backgroundColor?: string;
  // Pixel Sort
  direction?: "horizontal" | "vertical";
  sortThreshold?: number;
  sortRange?: number;
  // Chromatic Aberration
  radialFalloff?: boolean;
  // Film Grain
  size?: number;
  animated?: boolean;
  // Hologram
  hologramColor?: string;
  hologramScanlines?: number;
  hologramFlicker?: number;
  hologramEdgeGlow?: number;
  hologramTransparency?: number;
}

export type OutputFormat = "three_shaderpass" | "three_shadermaterial" | "three_texture" | "raw_glsl";

export function generateShaderCode(
  type: ShaderType,
  options: ShaderOptions = {},
  outputFormat: OutputFormat = "three_shaderpass"
): string {
  const resolution = options.resolution ?? [1920, 1080];
  const intensity = options.intensity ?? 1.0;

  let fragmentCode: string;
  let uniformsObj: Record<string, string> = {
    tDiffuse: "{ value: null }",
    uResolution: `{ value: new THREE.Vector2(${resolution[0]}, ${resolution[1]}) }`,
    uTime: "{ value: 0.0 }",
  };

  switch (type) {
    case "crt":
      fragmentCode = crtFragment({
        scanlineIntensity: (options.scanlineIntensity ?? 0.3) * intensity,
        curvature: options.curvature ?? 6.0,
        vignetteStrength: options.vignetteStrength ?? 0.25,
        chromaticAberration: (options.chromaticAberration ?? 0.002) * intensity,
      });
      break;

    case "bloom": {
      const threshold = options.threshold ?? 0.7;
      const blurRadius = options.blurRadius ?? 8;
      const bloomInt = (options.bloomIntensity ?? 1.5) * intensity;
      if (outputFormat === "raw_glsl") {
        fragmentCode = [
          "// === Bright Pass ===",
          bloomBrightPassFragment(threshold),
          "\n// === Horizontal Blur ===",
          bloomBlurFragment(true, blurRadius),
          "\n// === Vertical Blur ===",
          bloomBlurFragment(false, blurRadius),
          "\n// === Composite ===",
          bloomCompositeFragment(bloomInt),
        ].join("\n");
      } else {
        return generateBloomMultiPass(threshold, blurRadius, bloomInt, resolution, outputFormat);
      }
      break;
    }

    case "ascii":
      fragmentCode = asciiFragment({
        charSize: options.charSize ?? 8.0,
        edgeThreshold: (options.edgeThreshold ?? 0.15) * intensity,
        colorMode: options.colorMode ?? "mono",
      });
      break;

    case "kuwahara":
      fragmentCode = kuwaharaFragment({
        radius: options.radius ?? 4,
        sharpness: (options.sharpness ?? 8.0) * intensity,
      });
      break;

    case "halftone":
      fragmentCode = halftoneFragment({
        dotSize: options.dotSize ?? 6.0,
        spread: (options.spread ?? 1.2) * intensity,
        cmyk: options.cmyk ?? false,
      });
      break;

    case "dithering":
      fragmentCode = ditheringFragment({
        method: options.ditheringMethod ?? "bayer",
        levels: options.levels ?? 4.0,
        colorize: options.colorize ?? false,
      });
      break;

    case "edge_detection":
      fragmentCode = edgeDetectionFragment({
        method: options.edgeMethod ?? "sobel",
        threshold: (options.edgeThreshold ?? 0.1) / intensity,
        lineColor: hexToVec3(options.lineColor ?? "#ffffff"),
        backgroundColor: hexToVec3(options.backgroundColor ?? "#000000"),
      });
      break;

    case "pixel_sort":
      fragmentCode = pixelSortFragment({
        direction: options.direction ?? "horizontal",
        threshold: options.sortThreshold ?? 0.3,
        sortRange: options.sortRange ?? 16,
      });
      break;

    case "chromatic_aberration":
      fragmentCode = chromaticAberrationFragment({
        intensity: options.intensity ?? 1.0,
        radialFalloff: options.radialFalloff ?? true,
      });
      break;

    case "film_grain":
      fragmentCode = filmGrainFragment({
        intensity: options.intensity ?? 0.1,
        size: options.size ?? 1.0,
        animated: options.animated ?? true,
      });
      break;

    case "hologram":
      fragmentCode = hologramFragment({
        scanlineCount: options.hologramScanlines ?? 100,
        flickerIntensity: options.hologramFlicker ?? 0.1,
        rgbShift: 0.002 * (options.intensity ?? 1.0),
        edgeGlow: options.hologramEdgeGlow ?? 2.0,
        transparency: options.hologramTransparency ?? 0.9,
        color: options.hologramColor ?? "#00ffff",
      });
      break;

    default:
      throw new Error(`Unknown shader type: ${type}`);
  }

  if (outputFormat === "raw_glsl") {
    return `// Vertex Shader\n${commonVertex}\n\n// Fragment Shader\n${fragmentCode}`;
  }

  if (outputFormat === "three_texture") {
    return formatAsThreeTexture(type, commonVertex, fragmentCode, uniformsObj);
  }

  return formatAsThreeJs(type, commonVertex, fragmentCode, uniformsObj, outputFormat);
}

function formatAsThreeJs(
  name: string,
  vertex: string,
  fragment: string,
  uniforms: Record<string, string>,
  format: OutputFormat
): string {
  const uniformLines = Object.entries(uniforms)
    .map(([k, v]) => `    ${k}: ${v},`)
    .join("\n");

  const pascalName = name
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

  if (format === "three_shadermaterial") {
    return `import * as THREE from 'three';

const ${pascalName}Material = new THREE.ShaderMaterial({
  uniforms: {
${uniformLines}
  },
  vertexShader: \`${vertex}\`,
  fragmentShader: \`${fragment}\`
});

// Usage: mesh.material = ${pascalName}Material;
// Update in animation loop: ${pascalName}Material.uniforms.uTime.value = elapsed;
export { ${pascalName}Material };`;
  }

  // three_shaderpass (default)
  return `import * as THREE from 'three';

const ${pascalName}Shader = {
  uniforms: {
${uniformLines}
  },
  vertexShader: \`${vertex}\`,
  fragmentShader: \`${fragment}\`
};

// Usage with EffectComposer:
// import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
// const pass = new ShaderPass(${pascalName}Shader);
// composer.addPass(pass);
// In animation loop: pass.uniforms.uTime.value = elapsed;
export { ${pascalName}Shader };`;
}

function formatAsThreeTexture(
  name: string,
  vertex: string,
  fragment: string,
  uniforms: Record<string, string>
): string {
  const uniformLines = Object.entries(uniforms)
    .map(([k, v]) => `    ${k}: ${v},`)
    .join("\n");

  const pascalName = name
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

  return `import * as THREE from 'three';

// Render shader to texture (WebGLRenderTarget)
// Use ${pascalName}Texture as a texture on any geometry

const ${pascalName}RenderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});

const ${pascalName}Scene = new THREE.Scene();
const ${pascalName}Camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const ${pascalName}Material = new THREE.ShaderMaterial({
  uniforms: {
${uniformLines}
  },
  vertexShader: \`${vertex}\`,
  fragmentShader: \`${fragment}\`
});

const ${pascalName}Quad = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  ${pascalName}Material
);
${pascalName}Scene.add(${pascalName}Quad);

// Call this each frame to update the texture
function update${pascalName}Texture(renderer, elapsed) {
  ${pascalName}Material.uniforms.uTime.value = elapsed;
  renderer.setRenderTarget(${pascalName}RenderTarget);
  renderer.render(${pascalName}Scene, ${pascalName}Camera);
  renderer.setRenderTarget(null);
}

const ${pascalName}Texture = ${pascalName}RenderTarget.texture;

// Usage: apply to any mesh
// mesh.material.map = ${pascalName}Texture;
// In animation loop: update${pascalName}Texture(renderer, elapsed);

export { ${pascalName}Texture, update${pascalName}Texture, ${pascalName}RenderTarget, ${pascalName}Material };`;
}

function generateBloomMultiPass(
  threshold: number,
  _blurRadius: number,
  bloomIntensity: number,
  resolution: [number, number],
  _format: OutputFormat
): string {
  return `import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Working UnrealBloomPass pipeline — plug-and-play with any scene
// Requires: scene, camera, renderer already set up

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(${resolution[0]}, ${resolution[1]}),
  ${bloomIntensity.toFixed(2)},   // strength
  0.4,                             // radius
  ${threshold.toFixed(2)}          // threshold
);
composer.addPass(bloomPass);

// In your animation loop, call composer.render() instead of renderer.render(scene, camera):
// function animate() {
//   requestAnimationFrame(animate);
//   composer.render();
// }
// animate();

// To adjust at runtime:
// bloomPass.strength = 1.5;
// bloomPass.threshold = 0.7;
// bloomPass.radius = 0.4;

export { composer, bloomPass };`;
}
