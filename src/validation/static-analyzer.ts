/**
 * Static analysis of generated code — runs inside the MCP server, no external deps.
 * Returns a quality report alongside the generated output.
 */

import { ParameterWarning, ParameterFix } from "../types/tool-result.js";
import { extractColorPairs, checkContrastCompliance, analyzeColorHarmony } from "./color-analysis.js";
import { scorePbrSetup, scoreLayoutStructure, scoreCompositionIntegrity, scoreScrollCoverage } from "./scoring.js";

export interface QualityReport {
  overall: number;
  breakdown: Record<string, number>;
  warnings: ParameterWarning[];
  suggestions: ParameterFix[];
}

const WEIGHTS: Record<string, number> = {
  "WCAG Contrast": 0.20,
  "Color Harmony": 0.15,
  "PBR Rendering": 0.20,
  "Layout Structure": 0.15,
  "Composition": 0.15,
  "Scroll Coverage": 0.15,
};

export function analyzeGeneratedCode(code: string): QualityReport {
  const warnings: ParameterWarning[] = [];
  const fixes: ParameterFix[] = [];
  const breakdown: Record<string, number> = {};

  // 1. WCAG Contrast
  const colorPairs = extractColorPairs(code);
  const contrastResult = checkContrastCompliance(colorPairs);
  breakdown["WCAG Contrast"] = contrastResult.score;
  warnings.push(...contrastResult.warnings);
  fixes.push(...contrastResult.fixes);

  // 2. Color Harmony
  const hexColors = [...new Set((code.match(/#[0-9a-fA-F]{6}/g) ?? []))];
  const harmonyResult = analyzeColorHarmony(hexColors.slice(0, 6));
  breakdown["Color Harmony"] = harmonyResult.score;
  if (harmonyResult.score < 80) {
    warnings.push({
      code: "WEAK_COLOR_HARMONY",
      message: `Color harmony pattern: ${harmonyResult.pattern}. Consider using complementary or triadic color relationships.`,
      severity: "minor",
      category: "Color Harmony",
    });
    fixes.push({
      paramPath: "designTokens.colors.accent",
      currentValue: undefined,
      suggestedValue: undefined,
      reasoning: `Current palette uses ${harmonyResult.pattern} pattern. Triadic or complementary schemes score higher.`,
      impact: "medium",
    });
  }

  // 3. PBR Rendering
  const pbrResult = scorePbrSetup(code);
  breakdown["PBR Rendering"] = pbrResult.score;
  warnings.push(...pbrResult.warnings);
  fixes.push(...pbrResult.fixes);

  // 4. Layout Structure
  const layoutResult = scoreLayoutStructure(code);
  breakdown["Layout Structure"] = layoutResult.score;
  warnings.push(...layoutResult.warnings);
  fixes.push(...layoutResult.fixes);

  // 5. Composition Integrity
  const compositionResult = scoreCompositionIntegrity(code);
  breakdown["Composition"] = compositionResult.score;
  warnings.push(...compositionResult.warnings);
  fixes.push(...compositionResult.fixes);

  // 6. Scroll Coverage
  const scrollResult = scoreScrollCoverage(code);
  breakdown["Scroll Coverage"] = scrollResult.score;
  warnings.push(...scrollResult.warnings);
  fixes.push(...scrollResult.fixes);

  // Compute weighted overall score
  let overall = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    overall += (breakdown[key] ?? 0) * weight;
  }

  return {
    overall: Math.round(overall),
    breakdown,
    warnings,
    suggestions: fixes,
  };
}
