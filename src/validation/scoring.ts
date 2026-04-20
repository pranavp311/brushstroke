/** Scoring functions for static code analysis */

import { ParameterWarning, ParameterFix } from "../types/tool-result.js";

export interface ScoringResult {
  score: number;
  warnings: ParameterWarning[];
  fixes: ParameterFix[];
}

/** Check PBR rendering setup quality */
export function scorePbrSetup(code: string): ScoringResult {
  const checks = [
    {
      pattern: /toneMapping/,
      label: "Tone mapping configured",
      weight: 25,
      code: "MISSING_TONE_MAPPING",
      fix: { paramPath: "designTokens.materials.toneMapping", suggestedValue: "ACESFilmic", reasoning: "ACES filmic tone mapping provides realistic HDR-to-LDR conversion", impact: "high" as const },
    },
    {
      pattern: /environment\s*=/,
      label: "Environment map set",
      weight: 25,
      code: "MISSING_ENV_MAP",
      fix: { paramPath: "designTokens.lighting.envMapIntensity", suggestedValue: 1.0, reasoning: "Environment map adds realistic reflections to PBR materials", impact: "high" as const },
    },
    {
      pattern: /PMREMGenerator/,
      label: "PMREMGenerator used",
      weight: 25,
      code: "MISSING_PMREM",
      fix: { paramPath: "designTokens.lighting.envMapIntensity", suggestedValue: 1.0, reasoning: "PMREMGenerator pre-filters environment maps for accurate PBR", impact: "medium" as const },
    },
    {
      pattern: /setPixelRatio/,
      label: "Pixel ratio set",
      weight: 15,
      code: "MISSING_PIXEL_RATIO",
      fix: null,
    },
    {
      pattern: /shadowMap/,
      label: "Shadow map enabled",
      weight: 10,
      code: "MISSING_SHADOW_MAP",
      fix: null,
    },
  ];

  let score = 0;
  const warnings: ParameterWarning[] = [];
  const fixes: ParameterFix[] = [];

  for (const check of checks) {
    if (check.pattern.test(code)) {
      score += check.weight;
    } else {
      warnings.push({
        code: check.code,
        message: `Missing: ${check.label}`,
        severity: check.weight >= 25 ? "major" : "minor",
        category: "PBR Rendering",
      });
      if (check.fix) {
        fixes.push({ ...check.fix, currentValue: undefined });
      }
    }
  }

  return { score, warnings, fixes };
}

/** Check layout structure quality */
export function scoreLayoutStructure(code: string): ScoringResult {
  const warnings: ParameterWarning[] = [];
  const fixes: ParameterFix[] = [];
  let score = 0;

  // Semantic elements
  const semanticTags = ["<nav", "<main", "<section", "<footer", "<header", "<article"];
  const foundSemantic = semanticTags.filter(tag => code.includes(tag));
  const semanticScore = Math.min(30, (foundSemantic.length / 3) * 30);
  score += semanticScore;
  if (foundSemantic.length < 2) {
    warnings.push({
      code: "FEW_SEMANTIC_ELEMENTS",
      message: "Few semantic HTML elements found — consider using <nav>, <section>, <footer>",
      severity: "minor",
      category: "Layout Structure",
    });
  }

  // Heading hierarchy
  const h1Count = (code.match(/<h1/g) ?? []).length;
  const h2Count = (code.match(/<h2/g) ?? []).length;
  if (h1Count >= 1) {
    score += 20;
  } else {
    warnings.push({
      code: "MISSING_H1",
      message: "No <h1> heading found",
      severity: "major",
      category: "Layout Structure",
    });
    fixes.push({
      paramPath: "sections[0].content.heading",
      currentValue: undefined,
      suggestedValue: "Add a heading",
      reasoning: "Every page needs an <h1> for SEO and accessibility",
      impact: "high",
    });
  }
  if (h2Count >= 1) score += 10;

  // Responsive
  if (code.includes("@media") || code.includes("clamp(") || code.includes("auto-fit")) {
    score += 20;
  } else {
    warnings.push({
      code: "NO_RESPONSIVE_BREAKPOINTS",
      message: "No responsive breakpoints or fluid sizing detected",
      severity: "major",
      category: "Layout Structure",
    });
    fixes.push({
      paramPath: "sections[0].content.layout",
      currentValue: undefined,
      suggestedValue: "centered",
      reasoning: "Use a responsive layout variant to support different screen sizes",
      impact: "medium",
    });
  }

  // Accessibility
  if (code.includes("role=") || code.includes("aria-")) {
    score += 20;
  } else {
    warnings.push({
      code: "NO_ARIA_ATTRIBUTES",
      message: "No ARIA attributes found",
      severity: "major",
      category: "Layout Structure",
    });
    fixes.push({
      paramPath: "sections[0].content.ctaLink",
      currentValue: undefined,
      suggestedValue: "#main",
      reasoning: "Add aria-label to interactive elements for screen reader support",
      impact: "medium",
    });
  }

  return { score: Math.min(100, score), warnings, fixes };
}

/** Check composition integrity */
export function scoreCompositionIntegrity(code: string): ScoringResult {
  const warnings: ParameterWarning[] = [];
  const fixes: ParameterFix[] = [];
  let score = 0;

  // Single WebGL context check
  const rendererCount = (code.match(/new THREE\.WebGLRenderer/g) ?? []).length;
  if (rendererCount === 1) {
    score += 35;
  } else if (rendererCount > 1) {
    warnings.push({
      code: "MULTIPLE_RENDERERS",
      message: `Multiple WebGL renderers detected (${rendererCount}) — should be 1 for composition`,
      severity: "critical",
      category: "Composition",
    });
    score += 10;
  } else {
    score += 20; // No renderer may be valid for non-3D pages
  }

  // Resize handler
  if (code.includes("addEventListener('resize'") || code.includes('addEventListener("resize"')) {
    score += 25;
  } else {
    warnings.push({
      code: "MISSING_RESIZE_HANDLER",
      message: "No resize handler found",
      severity: "major",
      category: "Composition",
    });
  }

  // Animation loop
  if (code.includes("requestAnimationFrame")) {
    score += 25;
  } else {
    warnings.push({
      code: "MISSING_ANIMATION_LOOP",
      message: "No animation loop (requestAnimationFrame) found",
      severity: "major",
      category: "Composition",
    });
  }

  // Content present
  const sectionCount = (code.match(/<section/g) ?? []).length;
  if (sectionCount >= 1) {
    score += 15;
  } else {
    warnings.push({
      code: "NO_SECTIONS",
      message: "No <section> elements found",
      severity: "minor",
      category: "Composition",
    });
  }

  return { score: Math.min(100, score), warnings, fixes };
}

/** Check scroll animation coverage */
export function scoreScrollCoverage(code: string): ScoringResult {
  const warnings: ParameterWarning[] = [];
  const fixes: ParameterFix[] = [];
  let score = 0;

  // Keyframes present
  if (code.includes("keyframes")) {
    score += 30;
  } else {
    warnings.push({
      code: "NO_KEYFRAME_SYSTEM",
      message: "No keyframe system found",
      severity: "major",
      category: "Scroll Coverage",
    });
    fixes.push({
      paramPath: "sections[0].scrollAnimation",
      currentValue: undefined,
      suggestedValue: { rotation: { y: 1.57 } },
      reasoning: "Add scroll-triggered animation keyframes for engaging scroll experience",
      impact: "high",
    });
  }

  // Easing function
  if (code.includes("easeInOutCubic") || code.includes("ease") || code.includes("smoothstep")) {
    score += 25;
  } else {
    warnings.push({
      code: "NO_EASING_FUNCTION",
      message: "No easing function applied to scroll animations",
      severity: "minor",
      category: "Scroll Coverage",
    });
    fixes.push({
      paramPath: "sections[0].scrollAnimation.ease",
      currentValue: undefined,
      suggestedValue: "easeInOutCubic",
      reasoning: "Easing functions create natural, polished animation motion",
      impact: "medium",
    });
  }

  // Lerp interpolation
  if (code.includes("lerp")) {
    score += 25;
  } else {
    warnings.push({
      code: "NO_LERP_INTERPOLATION",
      message: "No lerp interpolation found — animations may snap",
      severity: "minor",
      category: "Scroll Coverage",
    });
  }

  // Scroll progress calculation
  if (code.includes("scrollY") || code.includes("scrollTop") || code.includes("scrollProgress")) {
    score += 20;
  } else {
    warnings.push({
      code: "NO_SCROLL_TRACKING",
      message: "No scroll progress tracking found",
      severity: "major",
      category: "Scroll Coverage",
    });
  }

  return { score: Math.min(100, score), warnings, fixes };
}
