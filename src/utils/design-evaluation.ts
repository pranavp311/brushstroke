/**
 * Reusable VLM design evaluation logic.
 * Extracted from design-evaluator tool for shared use.
 */

import { VLMClient } from "../validation/vlm/client.js";
import { buildDesignEvaluationPrompt } from "../validation/vlm/design-prompts.js";
import { DesignEvaluationResult } from "../validation/vlm/types.js";

export async function evaluateDesign(
  screenshots: string[],
  designBrief: string,
  currentParams?: string,
  options?: {
    vlmProvider?: "ollama" | "together" | "fireworks" | "openai";
    vlmModel?: string;
    vlmApiKey?: string;
    previousScore?: number;
    iterationNumber?: number;
  }
): Promise<DesignEvaluationResult> {
  const {
    vlmProvider = "ollama",
    vlmModel = "qwen2.5-vl:7b",
    vlmApiKey,
    previousScore,
    iterationNumber = 1,
  } = options ?? {};

  const client = new VLMClient({
    provider: vlmProvider,
    model: vlmModel,
    apiKey: vlmApiKey,
    maxTokens: 4096,
    temperature: 0.2,
  });

  const prompt = buildDesignEvaluationPrompt({
    designBrief,
    currentParams,
    iterationNumber,
    previousScore,
  });

  const response = await client.analyzeMultipleImages(screenshots, prompt);
  return parseEvaluationResponse(response.content, previousScore);
}

function parseEvaluationResponse(
  content: string,
  previousScore?: number
): DesignEvaluationResult {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      overallScore: 50,
      categories: {
        aestheticMatch: 50, colorHarmony: 50, typography: 50, layout: 50,
        threeDIntegration: 50, distinctiveness: 50, technicalQuality: 50,
      },
      issues: [],
      summary: `VLM response could not be parsed as JSON. Raw response: ${content.slice(0, 500)}`,
      shouldContinue: true,
      improvementFromPrevious: null,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const clamp = (v: unknown) => Math.max(0, Math.min(100, Number(v) || 50));

    const categories: Record<string, number> = {};
    const categoryKeys = [
      "aestheticMatch", "colorHarmony", "typography", "layout",
      "threeDIntegration", "distinctiveness", "technicalQuality",
    ];
    for (const key of categoryKeys) {
      categories[key] = clamp(parsed.categories?.[key]);
    }

    const overallScore = clamp(parsed.overallScore);

    const issues = Array.isArray(parsed.issues)
      ? parsed.issues.map((issue: Record<string, unknown>) => ({
          category: String(issue.category ?? "unknown"),
          severity: (["critical", "major", "minor"].includes(issue.severity as string)
            ? issue.severity
            : "minor") as "critical" | "major" | "minor",
          description: String(issue.description ?? ""),
          suggestedFix: issue.suggestedFix
            ? {
                paramPath: String((issue.suggestedFix as Record<string, unknown>).paramPath ?? ""),
                currentValue: String((issue.suggestedFix as Record<string, unknown>).currentValue ?? "unknown"),
                suggestedValue: String((issue.suggestedFix as Record<string, unknown>).suggestedValue ?? ""),
                reasoning: String((issue.suggestedFix as Record<string, unknown>).reasoning ?? ""),
              }
            : { paramPath: "", currentValue: "unknown", suggestedValue: "", reasoning: "" },
        }))
      : [];

    const improvementFromPrevious = previousScore != null
      ? overallScore - previousScore
      : (parsed.improvementFromPrevious ?? null);

    return {
      overallScore,
      categories,
      issues,
      summary: String(parsed.summary ?? "Evaluation complete."),
      shouldContinue: parsed.shouldContinue ?? (overallScore < 85 || issues.some((i: { severity: string }) => i.severity === "critical")),
      improvementFromPrevious,
    };
  } catch {
    return {
      overallScore: 50,
      categories: {
        aestheticMatch: 50, colorHarmony: 50, typography: 50, layout: 50,
        threeDIntegration: 50, distinctiveness: 50, technicalQuality: 50,
      },
      issues: [],
      summary: `Failed to parse VLM JSON. Raw: ${content.slice(0, 500)}`,
      shouldContinue: true,
      improvementFromPrevious: null,
    };
  }
}
