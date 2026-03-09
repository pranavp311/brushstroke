export function asciiFragment(opts: { charSize: number; edgeThreshold: number; colorMode: "mono" | "color" }): string {
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

  // Sobel edge detection
  float dx = luminance(texture2D(tDiffuse, cell + vec2(cellSize.x, 0.0)).rgb) -
             luminance(texture2D(tDiffuse, cell - vec2(cellSize.x, 0.0)).rgb);
  float dy = luminance(texture2D(tDiffuse, cell + vec2(0.0, cellSize.y)).rgb) -
             luminance(texture2D(tDiffuse, cell - vec2(0.0, cellSize.y)).rgb);
  float edge = length(vec2(dx, dy));

  // Character selection based on luminance
  int n = 4096;
  if (lum > 0.2) n = 65600;
  if (lum > 0.3) n = 163153;
  if (lum > 0.4) n = 15255086;
  if (lum > 0.5) n = 13121101;
  if (lum > 0.6) n = 15## 252014;
  if (lum > 0.7) n = 11512810;
  if (lum > 0.8) n = 32012382;

  // Edge characters override
  if (edge > ${opts.edgeThreshold.toFixed(2)}) {
    float angle = atan(dy, dx);
    if (abs(angle) < 0.4) n = 4329604;       // —
    else if (abs(angle) > 1.2) n = 4541220;  // |
    else if (angle > 0.0) n = 1131796;       // /
    else n = 4460068;                          // \\
  }

  float charBrightness = character(n, localUv);
  ${colorOutput}

  gl_FragColor = vec4(finalColor, 1.0);
}`;
}
