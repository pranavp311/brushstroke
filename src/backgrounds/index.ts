import { ColorScheme, DEFAULT_SCHEME } from "../utils/color-utils.js";
import { standaloneHtml, threeImportMap } from "../utils/html-template.js";
import { particlesBackground } from "./particles.js";
import { gradientMeshBackground } from "./gradient-mesh.js";
import { noiseTerrainBackground } from "./noise-terrain.js";
import { floatingGeometryBackground } from "./floating-geometry.js";
import { waveBackground } from "./wave.js";
import { starfieldBackground } from "./starfield.js";
import { auroraBackground } from "./aurora.js";
import { matrixRainBackground } from "./matrix-rain.js";

export type BackgroundPreset =
  | "particles"
  | "gradient_mesh"
  | "noise_terrain"
  | "floating_geometry"
  | "wave"
  | "starfield"
  | "aurora"
  | "matrix_rain";

export type Quality = "low" | "medium" | "high";
export type BackgroundOutputFormat = "standalone_html" | "module_js" | "component_react";

const QUALITY_MAP: Record<Quality, { count: number; segments: number }> = {
  low: { count: 500, segments: 32 },
  medium: { count: 2000, segments: 64 },
  high: { count: 10000, segments: 128 },
};

const generators: Record<BackgroundPreset, (colors: ColorScheme, countOrSegs: number, interactive: boolean) => string> = {
  particles: particlesBackground,
  gradient_mesh: gradientMeshBackground,
  noise_terrain: noiseTerrainBackground,
  floating_geometry: floatingGeometryBackground,
  wave: waveBackground,
  starfield: starfieldBackground,
  aurora: auroraBackground,
  matrix_rain: matrixRainBackground,
};

export function generateBackground(
  preset: BackgroundPreset,
  colors: Partial<ColorScheme> = {},
  quality: Quality = "medium",
  interactive: boolean = true,
  outputFormat: BackgroundOutputFormat = "standalone_html"
): string {
  const scheme: ColorScheme = { ...DEFAULT_SCHEME, ...colors };
  const q = QUALITY_MAP[quality];
  const gen = generators[preset];
  if (!gen) throw new Error(`Unknown preset: ${preset}`);

  // Use count for particle-like presets, segments for mesh-like presets
  const param = ["particles", "floating_geometry", "starfield", "matrix_rain"].includes(preset)
    ? q.count
    : q.segments;

  const moduleCode = gen(scheme, param, interactive);

  if (outputFormat === "module_js") {
    return moduleCode;
  }

  if (outputFormat === "component_react") {
    return wrapAsReactComponent(preset, moduleCode);
  }

  // standalone_html
  return standaloneHtml({
    title: `${preset} Background`,
    importMap: threeImportMap(),
    moduleScript: moduleCode,
  });
}

function wrapAsReactComponent(preset: string, code: string): string {
  const name = preset
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

  return `import { useEffect, useRef } from 'react';

export function ${name}Background() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dynamic import for Three.js
    const init = async () => {
      const THREE = await import('three');
      ${code.replace(/document\.body\.appendChild\(renderer\.domElement\)/, "container.appendChild(renderer.domElement)")}
    };
    init();

    return () => {
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
}`;
}
