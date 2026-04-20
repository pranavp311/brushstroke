export function asciiFragment(opts: {
  charSize: number;
  edgeThreshold: number;
  colorMode: "mono" | "color";
  exposure?: number;
  attenuation?: number;
}): string {
  const exposure = opts.exposure ?? 1.2;
  const attenuation = opts.attenuation ?? 1.0;
  const colorOutput = opts.colorMode === "color"
    ? "vec3 finalColor = originalColor * charBrightness;"
    : "vec3 finalColor = vec3(charBrightness);";

  return `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uTime;
varying vec2 vUv;

float luminance(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

float character(int n, vec2 p) {
  p = floor(p * vec2(4.0, -4.0) + 2.5);
  if (clamp(p.x, 0.0, 4.0) == p.x && clamp(p.y, 0.0, 4.0) == p.y) {
    int a = int(round(p.x) + 5.0 * round(p.y));
    if (((n >> a) & 1) == 1) return 1.0;
  }
  return 0.0;
}

void main() {
  float charSize = ${opts.charSize.toFixed(1)};
  vec2 cellSize = vec2(charSize) / uResolution;
  vec2 cell = floor(vUv / cellSize) * cellSize + cellSize * 0.5;
  vec2 localUv = fract(vUv / cellSize);

  vec4 texColor = texture2D(tDiffuse, cell);
  vec3 originalColor = texColor.rgb;
  float lum = luminance(originalColor);

  // Exposure and attenuation controls (AcerolaFX-style)
  lum = pow(lum * ${exposure.toFixed(2)}, ${attenuation.toFixed(2)});
  lum = clamp(lum, 0.0, 1.0);

  // Sobel edge detection
  float dx = luminance(texture2D(tDiffuse, cell + vec2(cellSize.x, 0.0)).rgb) -
             luminance(texture2D(tDiffuse, cell - vec2(cellSize.x, 0.0)).rgb);
  float dy = luminance(texture2D(tDiffuse, cell + vec2(0.0, cellSize.y)).rgb) -
             luminance(texture2D(tDiffuse, cell - vec2(0.0, cellSize.y)).rgb);
  float edge = length(vec2(dx, dy));

  // 10 luminance levels (expanded from 8) — matching AcerolaFX bucketing
  int n = 4096;                        // space (very dark)
  if (lum > 0.1) n = 4329476;         // .
  if (lum > 0.2) n = 65600;           // :
  if (lum > 0.3) n = 163153;          // -
  if (lum > 0.4) n = 15255086;        // =
  if (lum > 0.5) n = 13121101;        // +
  if (lum > 0.6) n = 15252014;        // *
  if (lum > 0.7) n = 11512810;        // #
  if (lum > 0.8) n = 32012382;        // @
  if (lum > 0.9) n = 33061950;        // full block

  // 5 edge direction characters
  if (edge > ${opts.edgeThreshold.toFixed(2)}) {
    float angle = atan(dy, dx);
    if (abs(angle) < 0.4) n = 4329604;           // horizontal —
    else if (abs(angle) > 1.2) n = 4541220;      // vertical |
    else if (angle > 0.0) n = 1131796;           // forward /
    else n = 4460068;                              // backslash
    // Cross for strong edges in both directions
    if (abs(dx) > ${(opts.edgeThreshold * 1.5).toFixed(2)} && abs(dy) > ${(opts.edgeThreshold * 1.5).toFixed(2)}) n = 4735540; // +
  }

  float charBrightness = character(n, localUv);
  ${colorOutput}

  gl_FragColor = vec4(finalColor, 1.0);
}`;
}
