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
