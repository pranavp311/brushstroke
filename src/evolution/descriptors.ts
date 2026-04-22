import type { PageSpec } from "../composition/page-engine.js";
import { resolveTokens, type DesignTokens } from "../utils/design-tokens.js";
import type { BackgroundPreset } from "../backgrounds/index.js";
import type { EasingName } from "../animations/easings.js";
import type {
  DescriptorVector,
  PaletteFamily,
  TypographicVoice,
  MotionDensity,
} from "./types.js";

export function computeDescriptor(spec: PageSpec): DescriptorVector {
  const tokens = resolveTokens(spec.themePreset, spec.designTokens);
  return {
    palette: paletteFamily(tokens),
    typography: typographicVoice(tokens),
    motion: motionDensity(spec),
  };
}

function paletteFamily(tokens: DesignTokens): PaletteFamily {
  const paletteHex = [
    tokens.colors.primary,
    tokens.colors.secondary,
    tokens.colors.accent,
  ];
  const hsv = paletteHex.map(hexToHsv);
  const saturations = hsv.map((c) => c.s);
  const hues = hsv.filter((c) => c.s > 0.12).map((c) => c.h);

  const meanSat = saturations.reduce((a, b) => a + b, 0) / saturations.length;
  if (meanSat < 0.15 || hues.length <= 1) return "mono";

  const clusters = hueClusters(hues, 22);

  if (clusters.length === 1) {
    const spread = hueSpread(hues);
    if (spread < 20) return "mono";
    return "analogous";
  }

  if (clusters.length === 2) {
    const sep = circularHueDistance(clusters[0], clusters[1]);
    if (sep > 150) return "complementary";
    if (sep < 60) return "analogous";
    return "duotone";
  }

  if (clusters.length === 3) {
    const a = circularHueDistance(clusters[0], clusters[1]);
    const b = circularHueDistance(clusters[1], clusters[2]);
    const c = circularHueDistance(clusters[0], clusters[2]);
    const dists = [a, b, c].sort((x, y) => x - y);
    if (dists[0] > 90 && Math.abs(dists[1] - dists[2]) < 40) return "triadic";
    return "polychrome";
  }

  return "polychrome";
}

function typographicVoice(tokens: DesignTokens): TypographicVoice {
  const heading = (tokens.typography.headingFont ?? tokens.typography.fontFamily).toLowerCase();
  const body = (tokens.typography.bodyFont ?? tokens.typography.fontFamily).toLowerCase();

  const stripGenericFallbacks = (f: string) =>
    f.replace(/sans[- ]?serif/gi, "").replace(/system-ui/gi, "");
  const isSerif = (f: string) => {
    const cleaned = stripGenericFallbacks(f);
    return /(serif|playfair|georgia|baskerville|garamond|times|source serif|cormorant|crimson|ibm plex serif)/i.test(cleaned);
  };
  const isMono = (f: string) =>
    /(monospace|fira code|jetbrains|ibm plex mono|courier|consolas|\bmono\b)/i.test(f);
  const isDisplay = (f: string) =>
    /(space grotesk|clash|satoshi|bebas|anton|druk|archivo)/i.test(f);

  if (isMono(heading)) return "mono";
  if (isSerif(heading) && !isSerif(body)) return "mixed";
  if (!isSerif(heading) && isSerif(body)) return "mixed";
  if (isSerif(heading)) return "serif";
  if (isDisplay(heading)) return "sans_display";
  const weight = tokens.typography.headingWeight;
  const hasTightTracking = !!tokens.typography.headingLetterSpacing?.startsWith("-0.0");
  if (weight >= 700 && (hasTightTracking || (tokens.typography.headingSizeScale ?? 1) >= 1.2)) {
    return "sans_display";
  }
  return "sans_text";
}

function motionDensity(spec: PageSpec): MotionDensity {
  const sections = spec.sections ?? [];
  const animated = sections.filter((s) => s.scrollAnimation).length;
  const easings = sections
    .map((s) => s.scrollAnimation?.ease)
    .filter((e): e is EasingName => !!e);
  const easingSeverityAvg =
    easings.length > 0
      ? easings.reduce((sum, e) => sum + easingSeverity(e), 0) / easings.length
      : 0;

  const bg = spec.background?.preset;
  const bgWeight = bg ? backgroundWeight(bg) : 0;
  const interactive = spec.background?.interactive ? 0.5 : 0;
  const qualityWeight =
    spec.background?.quality === "high"
      ? 0.6
      : spec.background?.quality === "low"
      ? 0 // low often means "barely there"
      : 0.3;

  const cameraPathBonus = sections.reduce(
    (sum, s) => sum + ((s.scrollAnimation?.cameraPath?.length ?? 0) > 1 ? 0.5 : 0),
    0,
  );

  const score =
    animated * 0.8 +
    easingSeverityAvg * 1.4 +
    bgWeight +
    interactive +
    qualityWeight +
    cameraPathBonus +
    Math.max(0, sections.length - 3) * 0.3;

  if (score < 1.0) return "still";
  if (score < 2.6) return "minimal";
  if (score < 4.2) return "moderate";
  if (score < 5.8) return "dynamic";
  return "maximalist";
}

function easingSeverity(name: EasingName): number {
  if (name === "linear") return 0.1;
  if (/Sine$/.test(name)) return 0.4;
  if (/Quad$/.test(name)) return 0.5;
  if (/Cubic$/.test(name)) return 0.6;
  if (/Quart$/.test(name)) return 0.7;
  if (/Quint$/.test(name)) return 0.8;
  if (/Expo$/.test(name)) return 0.9;
  if (/Circ$/.test(name)) return 0.7;
  if (/Back$/.test(name)) return 1.2;
  if (/Elastic$/.test(name)) return 1.5;
  if (/Bounce$/.test(name)) return 1.4;
  return 0.5;
}

function backgroundWeight(preset: BackgroundPreset): number {
  const weights: Record<BackgroundPreset, number> = {
    gradient_mesh: 0.8,
    wave: 1.0,
    aurora: 1.2,
    starfield: 1.2,
    particles: 1.4,
    floating_geometry: 1.8,
    noise_terrain: 1.8,
    matrix_rain: 2.0,
    fluid_sim: 2.4,
  };
  return weights[preset] ?? 1.0;
}

interface Hsv {
  h: number;
  s: number;
  v: number;
}

function hexToHsv(hex: string): Hsv {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue = (hue * 60 + 360) % 360;
  }
  const sat = max === 0 ? 0 : d / max;
  return { h: hue, s: sat, v: max };
}

function circularHueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function hueClusters(hues: number[], threshold: number): number[] {
  if (hues.length === 0) return [];
  const sorted = [...hues].sort((a, b) => a - b);
  const clusters: number[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const last = clusters[clusters.length - 1];
    if (circularHueDistance(sorted[i], last[last.length - 1]) <= threshold) {
      last.push(sorted[i]);
    } else {
      clusters.push([sorted[i]]);
    }
  }
  if (clusters.length > 1) {
    const first = clusters[0];
    const lastC = clusters[clusters.length - 1];
    if (circularHueDistance(first[0], lastC[lastC.length - 1]) <= threshold) {
      clusters[0] = [...lastC, ...first];
      clusters.pop();
    }
  }
  return clusters.map(
    (c) => c.reduce((sum, h) => sum + h, 0) / c.length,
  );
}

function hueSpread(hues: number[]): number {
  if (hues.length < 2) return 0;
  let max = 0;
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const d = circularHueDistance(hues[i], hues[j]);
      if (d > max) max = d;
    }
  }
  return max;
}
