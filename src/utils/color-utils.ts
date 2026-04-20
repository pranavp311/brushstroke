/** Color utilities for generating color schemes */

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export const DEFAULT_SCHEME: ColorScheme = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  accent: "#06b6d4",
  background: "#0f172a",
};

export function hexToVec3(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return `vec3(${r.toFixed(4)}, ${g.toFixed(4)}, ${b.toFixed(4)})`;
}

export function hexToRgbArray(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

export function hexToThreeColor(hex: string): string {
  return `new THREE.Color("${hex}")`;
}

export function schemeToGlsl(scheme: ColorScheme): string {
  return `vec3 primaryColor = ${hexToVec3(scheme.primary)};
vec3 secondaryColor = ${hexToVec3(scheme.secondary)};
vec3 accentColor = ${hexToVec3(scheme.accent)};
vec3 bgColor = ${hexToVec3(scheme.background)};`;
}

/** Lighten a hex color by a given amount (0-1) */
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgbArray(hex);
  const nr = Math.min(1, r + (1 - r) * amount);
  const ng = Math.min(1, g + (1 - g) * amount);
  const nb = Math.min(1, b + (1 - b) * amount);
  return rgbToHex(nr, ng, nb);
}

/** Darken a hex color by a given amount (0-1) */
export function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgbArray(hex);
  const nr = r * (1 - amount);
  const ng = g * (1 - amount);
  const nb = b * (1 - amount);
  return rgbToHex(nr, ng, nb);
}

/** Compute relative luminance per WCAG 2.1 */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgbArray(hex);
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Compute WCAG contrast ratio between two hex colors */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
