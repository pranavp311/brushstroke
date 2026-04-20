/**
 * Lightweight code analysis for non-page tools.
 * Returns StructuredFeedback based on common quality patterns.
 */

import { StructuredFeedback, ParameterWarning, ParameterFix, FEEDBACK_PREFIX } from "../types/tool-result.js";

export function analyzeCodeOutput(toolName: string, code: string, outputFormat: string = "standalone_html"): StructuredFeedback {
  const warnings: ParameterWarning[] = [];
  const fixes: ParameterFix[] = [];
  const breakdown: Record<string, number> = {};

  // Check for resize handler
  const hasResize = code.includes("addEventListener('resize'") || code.includes('addEventListener("resize"');
  breakdown["Resize Handling"] = hasResize ? 100 : 0;
  if (!hasResize) {
    warnings.push({
      code: "MISSING_RESIZE_HANDLER",
      message: "No resize handler found — canvas won't adapt to window changes",
      severity: "major",
      category: "Resize Handling",
    });
  }

  // Check for animation loop
  const hasRAF = code.includes("requestAnimationFrame");
  breakdown["Animation Loop"] = hasRAF ? 100 : 0;
  if (!hasRAF && (code.includes("THREE") || code.includes("WebGL"))) {
    warnings.push({
      code: "MISSING_ANIMATION_LOOP",
      message: "No requestAnimationFrame loop found",
      severity: "major",
      category: "Animation Loop",
    });
  }

  // Check for import map (standalone HTML)
  const hasImportMap = code.includes("importmap");
  if (outputFormat === "standalone_html") {
    breakdown["Import Map"] = hasImportMap ? 100 : 0;
    if (!hasImportMap && code.includes("import ")) {
      warnings.push({
        code: "MISSING_IMPORT_MAP",
        message: "No import map found — ES module imports may fail in browser",
        severity: "major",
        category: "Import Map",
      });
    }
  }

  // Check code size (warn if very small or very large)
  const codeSize = code.length;
  if (codeSize < 200) {
    breakdown["Code Completeness"] = 30;
    warnings.push({
      code: "CODE_TOO_SHORT",
      message: "Generated code is suspiciously short — may be incomplete",
      severity: "major",
      category: "Code Completeness",
    });
  } else if (codeSize > 50000) {
    breakdown["Code Completeness"] = 70;
    warnings.push({
      code: "CODE_VERY_LARGE",
      message: "Generated code exceeds 50KB — consider splitting into modules",
      severity: "minor",
      category: "Code Completeness",
    });
  } else {
    breakdown["Code Completeness"] = 100;
  }

  // Check for error handling
  const hasTryCatch = code.includes("try") && code.includes("catch");
  const hasErrorHandler = code.includes(".catch(") || code.includes("onerror") || hasTryCatch;
  breakdown["Error Handling"] = hasErrorHandler ? 100 : 50;

  // Compute overall
  const scores = Object.values(breakdown);
  const overall = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 50;

  return {
    quality: {
      overall,
      breakdown,
      pass: overall >= 70,
    },
    warnings,
    suggestions: fixes,
    metadata: {
      tool: toolName,
      outputFormat,
    },
  };
}

/** Format a StructuredFeedback as a __BRUSHSTROKE_FEEDBACK__ content block */
export function feedbackContentBlock(feedback: StructuredFeedback): { type: "text"; text: string } {
  return {
    type: "text" as const,
    text: `${FEEDBACK_PREFIX}\n${JSON.stringify(feedback)}`,
  };
}
