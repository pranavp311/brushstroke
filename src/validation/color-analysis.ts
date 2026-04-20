/** Color analysis utilities for quality validation */

import { contrastRatio, hexToRgbArray, darken, lighten } from "../utils/color-utils.js";
import { ParameterWarning, ParameterFix } from "../types/tool-result.js";

export interface ColorPair {
  foreground: string;
  background: string;
  context: string;
}

/** Extract hex color pairs from generated HTML/CSS code */
export function extractColorPairs(code: string): ColorPair[] {
  const pairs: ColorPair[] = [];

  // Look for text-on-background patterns in CSS blocks
  const cssBlockRegex = /\{([^}]+)\}/g;
  let match;
  while ((match = cssBlockRegex.exec(code)) !== null) {
    const block = match[1];
    const colorMatch = block.match(/(?:^|;|\s)color\s*:\s*(#[0-9a-fA-F]{3,8})/i);
    const bgMatch = block.match(/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8})/i);

    if (colorMatch && bgMatch) {
      pairs.push({
        foreground: normalizeHex(colorMatch[1]),
        background: normalizeHex(bgMatch[1]),
        context: "CSS rule",
      });
    }
  }

  // Check var() references for --color-text on --color-bg
  const textColorMatch = code.match(/--color-text\s*:\s*(#[0-9a-fA-F]{3,8})/);
  const bgColorMatch = code.match(/--color-bg\s*:\s*(#[0-9a-fA-F]{3,8})/);
  if (textColorMatch && bgColorMatch) {
    pairs.push({
      foreground: normalizeHex(textColorMatch[1]),
      background: normalizeHex(bgColorMatch[1]),
      context: "CSS variables (text on background)",
    });
  }

  const mutedMatch = code.match(/--color-text-muted\s*:\s*(#[0-9a-fA-F]{3,8})/);
  if (mutedMatch && bgColorMatch) {
    pairs.push({
      foreground: normalizeHex(mutedMatch[1]),
      background: normalizeHex(bgColorMatch[1]),
      context: "CSS variables (muted text on background)",
    });
  }

  return pairs;
}

/** Check WCAG contrast compliance for color pairs */
export function checkContrastCompliance(pairs: ColorPair[]): {
  score: number;
  warnings: ParameterWarning[];
  fixes: ParameterFix[];
} {
  if (pairs.length === 0) return { score: 80, warnings: [], fixes: [] };

  const warnings: ParameterWarning[] = [];
  const fixes: ParameterFix[] = [];
  let passCount = 0;

  for (const pair of pairs) {
    try {
      const ratio = contrastRatio(pair.foreground, pair.background);
      if (ratio >= 4.5) {
        passCount++;
      } else if (ratio >= 3.0) {
        passCount += 0.5;
        warnings.push({
          code: "WCAG_CONTRAST_AA_LARGE",
          message: `${pair.context}: contrast ratio ${ratio.toFixed(1)}:1 between ${pair.foreground} and ${pair.background} — passes AA Large but fails AA Normal`,
          severity: "major",
          category: "WCAG Contrast",
        });
        fixes.push(buildContrastFix(pair, ratio));
      } else {
        warnings.push({
          code: "WCAG_CONTRAST_FAIL",
          message: `${pair.context}: contrast ratio ${ratio.toFixed(1)}:1 between ${pair.foreground} and ${pair.background} — fails WCAG AA`,
          severity: "critical",
          category: "WCAG Contrast",
        });
        fixes.push(buildContrastFix(pair, ratio));
      }
    } catch {
      // Skip invalid color parsing
    }
  }

  const score = pairs.length > 0 ? Math.round((passCount / pairs.length) * 100) : 80;
  return { score, warnings, fixes };
}

/** Build a contrast fix suggestion for a failing color pair */
function buildContrastFix(pair: ColorPair, currentRatio: number): ParameterFix {
  // Determine the paramPath based on context
  const isTextOnBg = pair.context.includes("text") || pair.context === "CSS rule";
  const paramPath = isTextOnBg
    ? "designTokens.colors.text"
    : "designTokens.colors.background";

  // Try to compute a better color
  let suggestedValue: string;
  try {
    // Darken the foreground or lighten the background to improve contrast
    const fgRgb = hexToRgbArray(pair.foreground);
    const bgRgb = hexToRgbArray(pair.background);
    const fgLuminance = (fgRgb[0] + fgRgb[1] + fgRgb[2]) / 3;
    const bgLuminance = (bgRgb[0] + bgRgb[1] + bgRgb[2]) / 3;

    if (fgLuminance > bgLuminance) {
      // Light text on dark bg — lighten text more
      suggestedValue = lighten(pair.foreground, 0.3);
    } else {
      // Dark text on light bg — darken text more
      suggestedValue = darken(pair.foreground, 0.3);
    }
  } catch {
    suggestedValue = pair.foreground;
  }

  return {
    paramPath,
    currentValue: pair.foreground,
    suggestedValue,
    reasoning: `Contrast ratio ${currentRatio.toFixed(1)}:1 is below WCAG AA minimum of 4.5:1. Adjust text or background color.`,
    impact: "high",
  };
}

/** Analyze color harmony (hue distribution on color wheel) */
export function analyzeColorHarmony(colors: string[]): {
  score: number;
  pattern: string;
} {
  if (colors.length < 2) return { score: 70, pattern: "insufficient colors" };

  const hues = colors.map(c => {
    const [r, g, b] = hexToRgbArray(c);
    return rgbToHue(r, g, b);
  }).filter(h => h >= 0);

  if (hues.length < 2) return { score: 70, pattern: "achromatic" };

  // Check for known harmony patterns
  const sorted = [...hues].sort((a, b) => a - b);
  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    diffs.push(sorted[i] - sorted[i - 1]);
  }
  diffs.push(360 - sorted[sorted.length - 1] + sorted[0]);

  // Complementary: ~180° apart
  const hasComplementary = diffs.some(d => d > 150 && d < 210);
  // Analogous: all within ~60°
  const maxDiff = Math.max(...diffs);
  const isAnalogous = maxDiff < 90;
  // Triadic: ~120° apart
  const isTriadic = diffs.length >= 2 && diffs.filter(d => d > 100 && d < 140).length >= 2;

  if (isTriadic) return { score: 95, pattern: "triadic" };
  if (hasComplementary) return { score: 90, pattern: "complementary" };
  if (isAnalogous) return { score: 85, pattern: "analogous" };

  return { score: 70, pattern: "custom" };
}

function normalizeHex(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length === 3) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  return `#${h.substring(0, 6)}`;
}

function rgbToHue(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta < 0.01) return -1; // achromatic

  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  hue *= 60;
  if (hue < 0) hue += 360;
  return hue;
}
