import { generatePage, type PageSpec } from "../composition/page-engine.js";
import { capturePagePreviews } from "../utils/page-preview.js";
import { evaluateDesign } from "../utils/design-evaluation.js";
import { computeDescriptor } from "./descriptors.js";
import {
  DEFAULT_FITNESS_WEIGHTS,
  type ArchiveConfig,
  type CategoryScores,
  type DescriptorVector,
} from "./types.js";

export interface EvaluationResult {
  fitness: number;
  overallScore: number;
  categories: CategoryScores;
  descriptor: DescriptorVector;
  screenshot: string;
  failed: boolean;
  errorMessage?: string;
}

export async function evaluateSpec(
  spec: PageSpec,
  config: ArchiveConfig,
): Promise<EvaluationResult> {
  const descriptor = computeDescriptor(spec);
  const weights = config.fitnessWeights ?? DEFAULT_FITNESS_WEIGHTS;
  const zeroCategories: CategoryScores = {
    aestheticMatch: 0,
    colorHarmony: 0,
    typography: 0,
    layout: 0,
    threeDIntegration: 0,
    distinctiveness: 0,
    technicalQuality: 0,
  };

  let html: string;
  try {
    html = generatePage(spec).html;
  } catch (e) {
    return {
      fitness: 0,
      overallScore: 0,
      categories: zeroCategories,
      descriptor,
      screenshot: "",
      failed: true,
      errorMessage: `generatePage failed: ${(e as Error).message}`,
    };
  }

  let images: Array<{ base64: string; scrollPosition: number }>;
  try {
    const captured = await capturePagePreviews(html, {
      scrollPositions: [0, 0.5, 1.0],
      viewport: { width: 1280, height: 800 },
      maxWidth: 640,
      postLoadDelay: 2500,
    });
    images = captured.images;
    if (images.length === 0) {
      throw new Error("no screenshots captured");
    }
  } catch (e) {
    return {
      fitness: 0,
      overallScore: 0,
      categories: zeroCategories,
      descriptor,
      screenshot: "",
      failed: true,
      errorMessage: `capture failed: ${(e as Error).message}`,
    };
  }

  const screenshots = images.map((i) => i.base64);

  let evaluation;
  try {
    evaluation = await evaluateDesign(
      screenshots,
      config.designBrief,
      JSON.stringify(spec),
      {
        vlmProvider: config.vlmProvider,
        vlmModel: config.vlmModel,
        vlmApiKey: config.vlmApiKey,
      },
    );
  } catch (e) {
    return {
      fitness: 0,
      overallScore: 0,
      categories: zeroCategories,
      descriptor,
      screenshot: screenshots[0] ?? "",
      failed: true,
      errorMessage: `VLM failed: ${(e as Error).message}`,
    };
  }

  const cats = normalizeCategories(evaluation.categories);
  const fitness =
    weights.overall * evaluation.overallScore +
    weights.distinctiveness * cats.distinctiveness +
    weights.threeDIntegration * cats.threeDIntegration;

  return {
    fitness,
    overallScore: evaluation.overallScore,
    categories: cats,
    descriptor,
    screenshot: screenshots[0] ?? "",
    failed: false,
  };
}

function normalizeCategories(raw: Record<string, number>): CategoryScores {
  const get = (k: string) =>
    typeof raw[k] === "number" && !Number.isNaN(raw[k])
      ? Math.max(0, Math.min(100, raw[k]))
      : 50;
  return {
    aestheticMatch: get("aestheticMatch"),
    colorHarmony: get("colorHarmony"),
    typography: get("typography"),
    layout: get("layout"),
    threeDIntegration: get("threeDIntegration"),
    distinctiveness: get("distinctiveness"),
    technicalQuality: get("technicalQuality"),
  };
}
