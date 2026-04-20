/** Shared design token system for consistent theming across all tools */

import { ColorScheme, DEFAULT_SCHEME } from "./color-utils.js";

export interface DesignTokens {
  colors: ColorScheme & {
    surface: string;
    text: string;
    textMuted: string;
  };
  lighting: {
    ambientIntensity: number;
    keyIntensity: number;
    envMapIntensity: number;
  };
  materials: {
    toneMapping: string;
    toneMappingExposure: number;
  };
  typography: {
    fontFamily: string;
    headingFont?: string;
    bodyFont?: string;
    monoFont?: string;
    headingWeight: number;
    bodyWeight: number;
    headingLetterSpacing?: string;
    headingSizeScale?: number;
  };
}

export type ThemePreset = "dark_premium" | "light_clean" | "minimal" | "startup_bold" | "editorial";

const THEME_PRESETS: Record<ThemePreset, DesignTokens> = {
  dark_premium: {
    colors: {
      primary: "#A78BFA",
      secondary: "#7C3AED",
      accent: "#22D3EE",
      background: "#0B0F1A",
      surface: "#1E2333",
      text: "#F1F5F9",
      textMuted: "#94A3B8",
    },
    lighting: {
      ambientIntensity: 0.4,
      keyIntensity: 1.5,
      envMapIntensity: 1.0,
    },
    materials: {
      toneMapping: "THREE.ACESFilmicToneMapping",
      toneMappingExposure: 1.0,
    },
    typography: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      headingWeight: 700,
      bodyWeight: 400,
    },
  },
  light_clean: {
    colors: {
      primary: "#4F46E5",
      secondary: "#7C3AED",
      accent: "#0891B2",
      background: "#F5F0EB",
      surface: "#FFFFFF",
      text: "#1E293B",
      textMuted: "#64748B",
    },
    lighting: {
      ambientIntensity: 0.6,
      keyIntensity: 1.2,
      envMapIntensity: 0.8,
    },
    materials: {
      toneMapping: "THREE.ACESFilmicToneMapping",
      toneMappingExposure: 1.2,
    },
    typography: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      headingWeight: 700,
      bodyWeight: 400,
    },
  },
  minimal: {
    colors: {
      primary: "#18181B",
      secondary: "#3F3F46",
      accent: "#A1A1AA",
      background: "#FAFAFA",
      surface: "#FFFFFF",
      text: "#18181B",
      textMuted: "#71717A",
    },
    lighting: {
      ambientIntensity: 0.7,
      keyIntensity: 1.0,
      envMapIntensity: 0.6,
    },
    materials: {
      toneMapping: "THREE.ACESFilmicToneMapping",
      toneMappingExposure: 1.1,
    },
    typography: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      headingWeight: 600,
      bodyWeight: 400,
    },
  },
  startup_bold: {
    colors: {
      primary: "#18181B",
      secondary: "#3F3F46",
      accent: "#F97316",
      background: "#FAFAF9",
      surface: "#FFFFFF",
      text: "#18181B",
      textMuted: "#71717A",
    },
    lighting: {
      ambientIntensity: 0.6,
      keyIntensity: 1.2,
      envMapIntensity: 0.8,
    },
    materials: {
      toneMapping: "THREE.ACESFilmicToneMapping",
      toneMappingExposure: 1.2,
    },
    typography: {
      fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif",
      headingFont: "'Space Grotesk', system-ui, sans-serif",
      bodyFont: "'Inter', system-ui, sans-serif",
      monoFont: "'JetBrains Mono', 'Fira Code', monospace",
      headingWeight: 700,
      bodyWeight: 400,
      headingLetterSpacing: "-0.05em",
      headingSizeScale: 1.3,
    },
  },
  editorial: {
    colors: {
      primary: "#1A1A2E",
      secondary: "#16213E",
      accent: "#E94560",
      background: "#F8F5F0",
      surface: "#FFFFFF",
      text: "#1A1A2E",
      textMuted: "#6B7280",
    },
    lighting: {
      ambientIntensity: 0.5,
      keyIntensity: 1.3,
      envMapIntensity: 0.9,
    },
    materials: {
      toneMapping: "THREE.ACESFilmicToneMapping",
      toneMappingExposure: 1.1,
    },
    typography: {
      fontFamily: "'Playfair Display', Georgia, serif",
      headingFont: "'Playfair Display', Georgia, serif",
      bodyFont: "'Source Serif 4', Georgia, serif",
      monoFont: "'IBM Plex Mono', monospace",
      headingWeight: 700,
      bodyWeight: 400,
      headingLetterSpacing: "-0.03em",
      headingSizeScale: 1.1,
    },
  },
};

export function resolveTokens(
  themePreset?: ThemePreset,
  partial?: Partial<DesignTokens>
): DesignTokens {
  const base = THEME_PRESETS[themePreset ?? "light_clean"];
  if (!partial) return base;

  return {
    colors: { ...base.colors, ...partial.colors },
    lighting: { ...base.lighting, ...partial.lighting },
    materials: { ...base.materials, ...partial.materials },
    typography: { ...base.typography, ...partial.typography },
  };
}

export function tokensToColorScheme(tokens: DesignTokens): ColorScheme {
  return {
    primary: tokens.colors.primary,
    secondary: tokens.colors.secondary,
    accent: tokens.colors.accent,
    background: tokens.colors.background,
  };
}

export function colorSchemeToTokens(
  scheme: Partial<ColorScheme>,
  themePreset?: ThemePreset
): DesignTokens {
  const base = resolveTokens(themePreset);
  return {
    ...base,
    colors: {
      ...base.colors,
      ...scheme,
    },
  };
}

export { THEME_PRESETS };
