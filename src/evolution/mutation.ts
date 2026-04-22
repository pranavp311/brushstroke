import type { PageSpec } from "../composition/page-engine.js";
import { applyFixes } from "../utils/param-patcher.js";
import type { ParameterFix } from "../types/tool-result.js";
import type { BackgroundPreset } from "../backgrounds/index.js";
import type { EasingName } from "../animations/easings.js";
import type { ModelType, ModelStyle } from "../models/index.js";
import type { ThemePreset } from "../utils/design-tokens.js";
import type { Individual } from "./types.js";

const BACKGROUND_PRESETS: BackgroundPreset[] = [
  "particles",
  "gradient_mesh",
  "noise_terrain",
  "floating_geometry",
  "wave",
  "starfield",
  "aurora",
  "matrix_rain",
  "fluid_sim",
];

const MODEL_TYPES: ModelType[] = [
  "terrain",
  "abstract_sculpture",
  "low_poly_animal",
  "architectural",
  "crystal",
  "tree",
  "product",
  "tube",
  "torus",
  "helix",
];

const MODEL_STYLES: ModelStyle[] = [
  "flat",
  "smooth",
  "wireframe",
  "toon",
  "dna_helix",
  "voxel",
  "hologram",
  "neon_wire",
  "glitch",
  "particle_cloud",
];

const EASINGS: EasingName[] = [
  "linear",
  "easeInQuad", "easeOutQuad", "easeInOutQuad",
  "easeInCubic", "easeOutCubic", "easeInOutCubic",
  "easeInQuart", "easeOutQuart", "easeInOutQuart",
  "easeInSine", "easeOutSine", "easeInOutSine",
  "easeInExpo", "easeOutExpo", "easeInOutExpo",
  "easeInBack", "easeOutBack", "easeInOutBack",
  "easeInElastic", "easeOutElastic", "easeInOutElastic",
  "easeInBounce", "easeOutBounce", "easeInOutBounce",
];

const THEMES: ThemePreset[] = [
  "dark_premium",
  "light_clean",
  "minimal",
  "startup_bold",
  "editorial",
];

const HEADING_FONT_STACKS = [
  "'Inter', system-ui, -apple-system, sans-serif",
  "'Space Grotesk', system-ui, sans-serif",
  "'Playfair Display', Georgia, serif",
  "'Source Serif 4', Georgia, serif",
  "'JetBrains Mono', 'Fira Code', monospace",
  "'Archivo', system-ui, sans-serif",
  "'Bebas Neue', Impact, sans-serif",
  "'IBM Plex Serif', Georgia, serif",
];

const BODY_FONT_STACKS = [
  "'Inter', system-ui, sans-serif",
  "'Source Serif 4', Georgia, serif",
  "'IBM Plex Mono', monospace",
  "'Crimson Pro', Georgia, serif",
  "'Figtree', system-ui, sans-serif",
];

export interface MutateOptions {
  /** Current archive (for splice source). Empty on seed perturbation. */
  pool?: Individual[];
  /** Override RNG for reproducibility. */
  rng?: () => number;
}

export function mutate(spec: PageSpec, options: MutateOptions = {}): PageSpec {
  const rng = options.rng ?? Math.random;
  const pool = options.pool ?? [];

  const numOps = 1 + Math.floor(rng() * 3); // 1-3
  const fixes: ParameterFix[] = [];

  for (let i = 0; i < numOps; i++) {
    const roll = rng();
    if (roll < 0.5) fixes.push(...jitterOp(spec, rng));
    else if (roll < 0.85) fixes.push(...swapOp(spec, rng));
    else if (pool.length > 0) fixes.push(...spliceOp(pool, rng));
    else fixes.push(...swapOp(spec, rng));
  }

  const { params } = applyFixes(spec as unknown as Record<string, unknown>, fixes);
  return params as unknown as PageSpec;
}

function jitterOp(spec: PageSpec, rng: () => number): ParameterFix[] {
  const picks: Array<() => ParameterFix> = [
    () => jitterColor(spec, "primary", rng),
    () => jitterColor(spec, "secondary", rng),
    () => jitterColor(spec, "accent", rng),
    () => jitterLighting(spec, "ambientIntensity", 0.2, [0, 2], rng),
    () => jitterLighting(spec, "keyIntensity", 0.3, [0, 5], rng),
    () => jitterLighting(spec, "envMapIntensity", 0.2, [0, 3], rng),
    () => jitterBloom(spec, "threshold", 0.15, [0, 1.5], rng),
    () => jitterBloom(spec, "strength", 0.25, [0, 3], rng),
    () => jitterBloom(spec, "radius", 0.1, [0, 1], rng),
    () => jitterTypography(spec, "headingSizeScale", 0.15, [0.8, 1.6], rng),
    () => jitterTypographyWeight(spec, "headingWeight", rng),
    () => jitterModelComplexity(spec, rng),
  ];
  const pick = picks[Math.floor(rng() * picks.length)];
  return [pick()];
}

function swapOp(spec: PageSpec, rng: () => number): ParameterFix[] {
  const picks: Array<() => ParameterFix> = [
    () => swap("themePreset", THEMES, spec.themePreset, rng),
    () => swap("background.preset", BACKGROUND_PRESETS, spec.background?.preset, rng),
    () => ({
      paramPath: "background.quality",
      currentValue: spec.background?.quality ?? "medium",
      suggestedValue: pickOne(["low", "medium", "high"], rng, spec.background?.quality),
      reasoning: "evolution: swap background quality",
      impact: "medium" as const,
    }),
    () => ({
      paramPath: "background.interactive",
      currentValue: spec.background?.interactive ?? true,
      suggestedValue: !(spec.background?.interactive ?? true),
      reasoning: "evolution: toggle background interactivity",
      impact: "low" as const,
    }),
    () => swapEasing(spec, rng),
    () => ({
      paramPath: "modelSource.modelOptions.style",
      currentValue: spec.modelSource && spec.modelSource.type === "generate" ? spec.modelSource.modelOptions?.style : undefined,
      suggestedValue: pickOne(MODEL_STYLES, rng),
      reasoning: "evolution: swap model style",
      impact: "high" as const,
    }),
    () => swapModelType(spec, rng),
    () => ({
      paramPath: "designTokens.typography.headingFont",
      currentValue: undefined,
      suggestedValue: pickOne(HEADING_FONT_STACKS, rng),
      reasoning: "evolution: swap heading font",
      impact: "high" as const,
    }),
    () => ({
      paramPath: "designTokens.typography.bodyFont",
      currentValue: undefined,
      suggestedValue: pickOne(BODY_FONT_STACKS, rng),
      reasoning: "evolution: swap body font",
      impact: "medium" as const,
    }),
    () => swapBloom(spec, rng),
  ];
  const pick = picks[Math.floor(rng() * picks.length)];
  return [pick()];
}

function spliceOp(pool: Individual[], rng: () => number): ParameterFix[] {
  const donor = pool[Math.floor(rng() * pool.length)];
  const roll = rng();
  if (roll < 0.4 && donor.spec.sections?.length > 0) {
    return [
      {
        paramPath: "sections",
        currentValue: undefined,
        suggestedValue: structuredClone(donor.spec.sections),
        reasoning: "evolution: splice sections from donor",
        impact: "high",
      },
    ];
  }
  if (roll < 0.7 && donor.spec.designTokens?.colors) {
    return [
      {
        paramPath: "designTokens.colors",
        currentValue: undefined,
        suggestedValue: structuredClone(donor.spec.designTokens.colors),
        reasoning: "evolution: splice color palette from donor",
        impact: "high",
      },
    ];
  }
  if (donor.spec.designTokens?.typography) {
    return [
      {
        paramPath: "designTokens.typography",
        currentValue: undefined,
        suggestedValue: structuredClone(donor.spec.designTokens.typography),
        reasoning: "evolution: splice typography from donor",
        impact: "high",
      },
    ];
  }
  return [
    {
      paramPath: "themePreset",
      currentValue: undefined,
      suggestedValue: donor.spec.themePreset,
      reasoning: "evolution: splice theme preset",
      impact: "medium",
    },
  ];
}

// -- individual jitter/swap helpers --

function jitterColor(
  spec: PageSpec,
  field: "primary" | "secondary" | "accent",
  rng: () => number,
): ParameterFix {
  const current =
    spec.designTokens?.colors?.[field] ??
    defaultTokenColor(spec.themePreset, field);
  const rotated = rotateHue(current, (rng() - 0.5) * 90);
  return {
    paramPath: `designTokens.colors.${field}`,
    currentValue: current,
    suggestedValue: rotated,
    reasoning: `evolution: jitter ${field} hue`,
    impact: "medium",
  };
}

function jitterLighting(
  spec: PageSpec,
  field: "ambientIntensity" | "keyIntensity" | "envMapIntensity",
  magnitude: number,
  bounds: [number, number],
  rng: () => number,
): ParameterFix {
  const current = spec.designTokens?.lighting?.[field] ?? 1.0;
  const next = clamp(current + (rng() - 0.5) * 2 * magnitude, bounds[0], bounds[1]);
  return {
    paramPath: `designTokens.lighting.${field}`,
    currentValue: current,
    suggestedValue: Number(next.toFixed(3)),
    reasoning: `evolution: jitter lighting ${field}`,
    impact: "medium",
  };
}

function jitterBloom(
  spec: PageSpec,
  field: "threshold" | "strength" | "radius",
  magnitude: number,
  bounds: [number, number],
  rng: () => number,
): ParameterFix {
  const current = spec.postProcessing?.bloom?.[field] ?? (field === "strength" ? 1.0 : 0.5);
  const next = clamp(current + (rng() - 0.5) * 2 * magnitude, bounds[0], bounds[1]);
  return {
    paramPath: `postProcessing.bloom.${field}`,
    currentValue: current,
    suggestedValue: Number(next.toFixed(3)),
    reasoning: `evolution: jitter bloom ${field}`,
    impact: "low",
  };
}

function jitterTypography(
  spec: PageSpec,
  field: "headingSizeScale",
  magnitude: number,
  bounds: [number, number],
  rng: () => number,
): ParameterFix {
  const current = spec.designTokens?.typography?.[field] ?? 1.0;
  const next = clamp(current + (rng() - 0.5) * 2 * magnitude, bounds[0], bounds[1]);
  return {
    paramPath: `designTokens.typography.${field}`,
    currentValue: current,
    suggestedValue: Number(next.toFixed(3)),
    reasoning: `evolution: jitter ${field}`,
    impact: "low",
  };
}

function jitterTypographyWeight(
  spec: PageSpec,
  field: "headingWeight",
  rng: () => number,
): ParameterFix {
  const weights = [300, 400, 500, 600, 700, 800, 900];
  return {
    paramPath: `designTokens.typography.${field}`,
    currentValue: spec.designTokens?.typography?.[field],
    suggestedValue: pickOne(weights, rng),
    reasoning: `evolution: reroll ${field}`,
    impact: "medium",
  };
}

function jitterModelComplexity(spec: PageSpec, rng: () => number): ParameterFix {
  const current =
    spec.modelSource && spec.modelSource.type === "generate"
      ? spec.modelSource.modelOptions?.complexity ?? 0.5
      : 0.5;
  const next = clamp(current + (rng() - 0.5) * 0.4, 0.1, 1);
  return {
    paramPath: "modelSource.modelOptions.complexity",
    currentValue: current,
    suggestedValue: Number(next.toFixed(2)),
    reasoning: "evolution: jitter model complexity",
    impact: "low",
  };
}

function swap<T>(
  paramPath: string,
  choices: readonly T[],
  current: T | undefined,
  rng: () => number,
): ParameterFix {
  return {
    paramPath,
    currentValue: current,
    suggestedValue: pickOne(choices, rng, current),
    reasoning: `evolution: swap ${paramPath}`,
    impact: "high",
  };
}

function swapEasing(spec: PageSpec, rng: () => number): ParameterFix {
  const n = spec.sections?.length ?? 0;
  const idx = n > 0 ? Math.floor(rng() * n) : 0;
  return {
    paramPath: `sections[${idx}].scrollAnimation.ease`,
    currentValue: spec.sections?.[idx]?.scrollAnimation?.ease,
    suggestedValue: pickOne(EASINGS, rng),
    reasoning: "evolution: swap easing on section",
    impact: "medium",
  };
}

function swapModelType(spec: PageSpec, rng: () => number): ParameterFix {
  const current =
    spec.modelSource && spec.modelSource.type === "generate"
      ? spec.modelSource.modelType
      : undefined;
  return {
    paramPath: "modelSource",
    currentValue: spec.modelSource,
    suggestedValue: {
      type: "generate",
      modelType: pickOne(MODEL_TYPES, rng, current),
      modelOptions: {
        complexity:
          spec.modelSource && spec.modelSource.type === "generate"
            ? spec.modelSource.modelOptions?.complexity ?? 0.6
            : 0.6,
        style: pickOne(MODEL_STYLES, rng),
      },
    },
    reasoning: "evolution: reroll model source",
    impact: "high",
  };
}

function swapBloom(spec: PageSpec, rng: () => number): ParameterFix {
  const currentlyOn = !!spec.postProcessing?.bloom;
  if (currentlyOn && rng() < 0.3) {
    return {
      paramPath: "postProcessing",
      currentValue: spec.postProcessing,
      suggestedValue: {},
      reasoning: "evolution: disable bloom",
      impact: "medium",
    };
  }
  return {
    paramPath: "postProcessing.bloom",
    currentValue: spec.postProcessing?.bloom,
    suggestedValue: {
      threshold: Number((0.3 + rng() * 0.8).toFixed(2)),
      strength: Number((0.4 + rng() * 1.6).toFixed(2)),
      radius: Number((0.2 + rng() * 0.6).toFixed(2)),
    },
    reasoning: "evolution: reroll bloom",
    impact: "medium",
  };
}

// -- utilities --

function pickOne<T>(choices: readonly T[], rng: () => number, excluding?: T): T {
  if (choices.length === 1) return choices[0];
  for (let i = 0; i < 5; i++) {
    const c = choices[Math.floor(rng() * choices.length)];
    if (c !== excluding) return c;
  }
  return choices[Math.floor(rng() * choices.length)];
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function defaultTokenColor(
  _preset: PageSpec["themePreset"],
  _field: string,
): string {
  return "#6366f1";
}

function rotateHue(hex: string, degrees: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue = (hue * 60 + 360) % 360;
  }
  const sat = max === 0 ? 0 : d / max;
  const val = max;
  const newHue = (hue + degrees + 360) % 360;
  return hsvToHex(newHue, sat, val);
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60)       [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else              [r, g, b] = [c, 0, x];
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
