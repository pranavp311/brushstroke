import { commonVertex } from "./common/vertex.js";
import { crtFragment } from "./crt/fragment.js";
import { bloomBrightPassFragment, bloomBlurFragment, bloomCompositeFragment } from "./bloom/fragment.js";
import { asciiFragment } from "./ascii/fragment.js";
import { kuwaharaFragment } from "./kuwahara/fragment.js";
import { halftoneFragment } from "./halftone/fragment.js";
import { ditheringFragment } from "./dithering/fragment.js";
import { edgeDetectionFragment } from "./edge-detection/fragment.js";
import { pixelSortFragment } from "./pixel-sort/fragment.js";
import { hexToVec3 } from "../utils/color-utils.js";

export type ShaderType =
  | "ascii"
  | "kuwahara"
  | "halftone"
  | "crt"
  | "bloom"
  | "dithering"
  | "edge_detection"
  | "pixel_sort";

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
}

export type OutputFormat = "three_shaderpass" | "three_shadermaterial" | "raw_glsl";

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

    default:
      throw new Error(`Unknown shader type: ${type}`);
  }

  if (outputFormat === "raw_glsl") {
    return `// Vertex Shader\n${commonVertex}\n\n// Fragment Shader\n${fragmentCode}`;
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

function generateBloomMultiPass(
  threshold: number,
  blurRadius: number,
  bloomIntensity: number,
  resolution: [number, number],
  format: OutputFormat
): string {
  return `import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// === Bloom Bright-Pass Shader ===
const BloomBrightPass = {
  uniforms: {
    tDiffuse: { value: null },
    uThreshold: { value: ${threshold.toFixed(2)} }
  },
  vertexShader: \`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  \`,
  fragmentShader: \`${bloomBrightPassFragment(threshold)}\`
};

// === Horizontal Blur ===
const BloomBlurH = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(${resolution[0]}, ${resolution[1]}) }
  },
  vertexShader: BloomBrightPass.vertexShader,
  fragmentShader: \`${bloomBlurFragment(true, blurRadius)}\`
};

// === Vertical Blur ===
const BloomBlurV = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(${resolution[0]}, ${resolution[1]}) }
  },
  vertexShader: BloomBrightPass.vertexShader,
  fragmentShader: \`${bloomBlurFragment(false, blurRadius)}\`
};

// === Composite ===
const BloomComposite = {
  uniforms: {
    tDiffuse: { value: null },
    tBloom: { value: null }
  },
  vertexShader: BloomBrightPass.vertexShader,
  fragmentShader: \`${bloomCompositeFragment(bloomIntensity)}\`
};

// Usage:
// const composer = new EffectComposer(renderer);
// composer.addPass(new RenderPass(scene, camera));
// composer.addPass(new ShaderPass(BloomBrightPass));
// composer.addPass(new ShaderPass(BloomBlurH));
// composer.addPass(new ShaderPass(BloomBlurV));
// // For composite, you'll need to store the bloom texture and combine

export { BloomBrightPass, BloomBlurH, BloomBlurV, BloomComposite };`;
}
