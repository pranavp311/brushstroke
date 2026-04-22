import type { PageSpec } from "../composition/page-engine.js";

export type PaletteFamily =
  | "mono"
  | "duotone"
  | "analogous"
  | "triadic"
  | "complementary"
  | "polychrome";

export type TypographicVoice =
  | "serif"
  | "sans_display"
  | "sans_text"
  | "mono"
  | "mixed";

export type MotionDensity = "still" | "minimal" | "moderate" | "dynamic" | "maximalist";

export interface DescriptorVector {
  palette: PaletteFamily;
  typography: TypographicVoice;
  motion: MotionDensity;
}

export interface CategoryScores {
  aestheticMatch: number;
  colorHarmony: number;
  typography: number;
  layout: number;
  threeDIntegration: number;
  distinctiveness: number;
  technicalQuality: number;
}

export interface Individual {
  spec: PageSpec;
  fitness: number;
  overallScore: number;
  categories: CategoryScores;
  descriptor: DescriptorVector;
  screenshot?: string;
  parent?: string;
  generation: number;
  createdAt: number;
}

export interface Cell {
  key: string;
  descriptor: DescriptorVector;
  elite: Individual;
}

export interface ArchiveStats {
  occupiedCells: number;
  totalCells: number;
  coverage: number;
  meanFitness: number;
  maxFitness: number;
  generationsRun: number;
  totalEvaluations: number;
}

export interface ArchiveConfig {
  designBrief: string;
  vlmProvider?: "ollama" | "together" | "fireworks" | "openai";
  vlmModel?: string;
  vlmApiKey?: string;
  fitnessWeights?: {
    overall: number;
    distinctiveness: number;
    threeDIntegration: number;
  };
}

export const DEFAULT_FITNESS_WEIGHTS = {
  overall: 0.5,
  distinctiveness: 0.3,
  threeDIntegration: 0.2,
};

export const PALETTE_FAMILIES: PaletteFamily[] = [
  "mono",
  "duotone",
  "analogous",
  "triadic",
  "complementary",
  "polychrome",
];

export const TYPOGRAPHIC_VOICES: TypographicVoice[] = [
  "serif",
  "sans_display",
  "sans_text",
  "mono",
  "mixed",
];

export const MOTION_DENSITIES: MotionDensity[] = [
  "still",
  "minimal",
  "moderate",
  "dynamic",
  "maximalist",
];

export const GRID_SIZE =
  PALETTE_FAMILIES.length * TYPOGRAPHIC_VOICES.length * MOTION_DENSITIES.length;

export function descriptorKey(d: DescriptorVector): string {
  return `${d.palette}|${d.typography}|${d.motion}`;
}
