/**
 * GLSL shader passes for the multi-pass ASCII pipeline.
 * Adapted from AcerolaFX's ASCII shader for WebGL2.
 *
 * 4-pass pipeline:
 * 1. Luminance + DoG edge detection
 * 2. Sobel direction analysis
 * 3. ASCII character rendering
 * 4. Color composite
 */

import { FILL_CHARS, EDGE_CHARS } from "./char-sets.js";

/** Common vertex shader for all fullscreen passes */
export const fullscreenVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/** Pass 1: Luminance extraction + Difference of Gaussians edge detection */
export function luminanceDoGPass(exposure: number, attenuation: number): string {
  return `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
varying vec2 vUv;

float luminance(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

// Gaussian blur helper
float gaussianBlur(sampler2D tex, vec2 uv, vec2 dir, float sigma) {
  float total = 0.0;
  float weight = 0.0;
  int radius = int(ceil(sigma * 2.0));
  for (int i = -8; i <= 8; i++) {
    if (abs(i) > radius) continue;
    float fi = float(i);
    float w = exp(-0.5 * fi * fi / (sigma * sigma));
    total += luminance(texture2D(tex, uv + dir * fi).rgb) * w;
    weight += w;
  }
  return total / weight;
}

void main() {
  vec2 texel = 1.0 / uResolution;
  vec4 texColor = texture2D(tDiffuse, vUv);

  // Luminance with exposure/attenuation
  float lum = luminance(texColor.rgb);
  lum = pow(lum * ${exposure.toFixed(2)}, ${attenuation.toFixed(2)});
  lum = clamp(lum, 0.0, 1.0);

  // Difference of Gaussians for edge detection
  float g1 = gaussianBlur(tDiffuse, vUv, texel * vec2(1.0, 0.0), 1.0)
           + gaussianBlur(tDiffuse, vUv, texel * vec2(0.0, 1.0), 1.0);
  float g2 = gaussianBlur(tDiffuse, vUv, texel * vec2(1.0, 0.0), 2.0)
           + gaussianBlur(tDiffuse, vUv, texel * vec2(0.0, 1.0), 2.0);
  float edgeDoG = abs(g1 - g2) * 0.5;

  gl_FragColor = vec4(lum, edgeDoG, 0.0, 1.0);
}`;
}

/** Pass 2: Sobel direction analysis */
export function sobelDirectionPass(): string {
  return `
uniform sampler2D tLumEdge;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 texel = 1.0 / uResolution;

  // Sample luminance from pass 1
  float tl = texture2D(tLumEdge, vUv + vec2(-texel.x, texel.y)).r;
  float t  = texture2D(tLumEdge, vUv + vec2(0.0, texel.y)).r;
  float tr = texture2D(tLumEdge, vUv + vec2(texel.x, texel.y)).r;
  float l  = texture2D(tLumEdge, vUv + vec2(-texel.x, 0.0)).r;
  float r  = texture2D(tLumEdge, vUv + vec2(texel.x, 0.0)).r;
  float bl = texture2D(tLumEdge, vUv + vec2(-texel.x, -texel.y)).r;
  float b  = texture2D(tLumEdge, vUv + vec2(0.0, -texel.y)).r;
  float br = texture2D(tLumEdge, vUv + vec2(texel.x, -texel.y)).r;

  // Sobel kernels
  float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
  float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;

  float magnitude = length(vec2(gx, gy));
  float angle = atan(gy, gx);

  gl_FragColor = vec4(angle, magnitude, gx, gy);
}`;
}

/** Pass 3: ASCII character rendering */
export function asciiRenderPass(charSize: number, edgeSensitivity: number): string {
  // Build fill character selection GLSL
  const fillSelections = FILL_CHARS.map((val, i) => {
    const threshold = (i / FILL_CHARS.length).toFixed(2);
    return i === 0
      ? `  int n = ${val};`
      : `  if (lum > ${threshold}) n = ${val};`;
  }).join("\n");

  return `
uniform sampler2D tLumEdge;
uniform sampler2D tSobelDir;
uniform vec2 uResolution;
varying vec2 vUv;

float character(int n, vec2 p) {
  p = floor(p * vec2(4.0, -4.0) + 2.5);
  if (clamp(p.x, 0.0, 4.0) == p.x && clamp(p.y, 0.0, 4.0) == p.y) {
    int a = int(round(p.x) + 5.0 * round(p.y));
    if (((n >> a) & 1) == 1) return 1.0;
  }
  return 0.0;
}

void main() {
  float charSz = ${charSize.toFixed(1)};
  vec2 cellSize = vec2(charSz) / uResolution;
  vec2 cell = floor(vUv / cellSize) * cellSize + cellSize * 0.5;
  vec2 localUv = fract(vUv / cellSize);

  // Sample from pass 1 (luminance + DoG edge)
  vec4 lumEdge = texture2D(tLumEdge, cell);
  float lum = lumEdge.r;
  float dogEdge = lumEdge.g;

  // Sample from pass 2 (Sobel direction)
  vec4 sobelDir = texture2D(tSobelDir, cell);
  float angle = sobelDir.r;
  float magnitude = sobelDir.g;
  float gx = sobelDir.b;
  float gy = sobelDir.a;

  // Fill character selection (10 levels)
${fillSelections}

  // Edge character override
  float edgeStrength = max(dogEdge, magnitude);
  float edgeThreshold = ${edgeSensitivity.toFixed(2)};
  if (edgeStrength > edgeThreshold) {
    if (abs(angle) < 0.4) n = ${EDGE_CHARS.horizontal};
    else if (abs(angle) > 1.2) n = ${EDGE_CHARS.vertical};
    else if (angle > 0.0) n = ${EDGE_CHARS.forwardSlash};
    else n = ${EDGE_CHARS.backslash};
    if (abs(gx) > edgeThreshold * 1.5 && abs(gy) > edgeThreshold * 1.5) n = ${EDGE_CHARS.cross};
  }

  float charBrightness = character(n, localUv);
  gl_FragColor = vec4(vec3(charBrightness), 1.0);
}`;
}

/** Pass 4: Color composite */
export function colorCompositePass(colorMode: string, invert: boolean, colorBlend: number): string {
  const invertCode = invert ? "charBrt = 1.0 - charBrt;" : "";

  let colorCode: string;
  if (colorMode === "color") {
    colorCode = `vec3 finalColor = mix(fgColor, originalColor, ${colorBlend.toFixed(2)}) * charBrt + bgColor * (1.0 - charBrt);`;
  } else if (colorMode === "custom") {
    colorCode = `vec3 finalColor = fgColor * charBrt + bgColor * (1.0 - charBrt);`;
  } else {
    // mono
    colorCode = `vec3 finalColor = fgColor * charBrt + bgColor * (1.0 - charBrt);`;
  }

  return `
uniform sampler2D tAscii;
uniform sampler2D tOriginal;
uniform vec3 fgColor;
uniform vec3 bgColor;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  float charBrt = texture2D(tAscii, vUv).r;
  ${invertCode}
  vec3 originalColor = texture2D(tOriginal, vUv).rgb;
  ${colorCode}
  gl_FragColor = vec4(finalColor, 1.0);
}`;
}
