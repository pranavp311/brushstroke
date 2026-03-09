export function halftoneFragment(opts: { dotSize: number; spread: number; cmyk: boolean }): string {
  if (opts.cmyk) {
    return cmykHalftone(opts.dotSize, opts.spread);
  }
  return monoHalftone(opts.dotSize, opts.spread);
}

function monoHalftone(dotSize: number, spread: number): string {
  return `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
varying vec2 vUv;

float luminance(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main() {
  float dotSize = ${dotSize.toFixed(1)};
  vec2 fragCoord = vUv * uResolution;
  vec2 cell = floor(fragCoord / dotSize) * dotSize + dotSize * 0.5;
  vec2 cellUv = cell / uResolution;

  vec4 texColor = texture2D(tDiffuse, cellUv);
  float lum = luminance(texColor.rgb);

  float dist = length(fragCoord - cell) / (dotSize * 0.5);
  float radius = lum * ${spread.toFixed(2)};
  float dot = 1.0 - smoothstep(radius - 0.1, radius + 0.1, dist);

  gl_FragColor = vec4(vec3(dot), 1.0);
}`;
}

function cmykHalftone(dotSize: number, spread: number): string {
  return `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
varying vec2 vUv;

mat2 rotate(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

float halftone(vec2 fragCoord, float angle, float value, float dotSize) {
  vec2 rotated = rotate(angle) * fragCoord;
  vec2 cell = floor(rotated / dotSize) * dotSize + dotSize * 0.5;
  float dist = length(rotated - cell) / (dotSize * 0.5);
  float radius = value * ${spread.toFixed(2)};
  return 1.0 - smoothstep(radius - 0.1, radius + 0.1, dist);
}

void main() {
  float dotSize = ${dotSize.toFixed(1)};
  vec2 fragCoord = vUv * uResolution;
  vec4 texColor = texture2D(tDiffuse, vUv);
  vec3 rgb = texColor.rgb;

  // RGB to CMY
  float c = 1.0 - rgb.r;
  float m = 1.0 - rgb.g;
  float y = 1.0 - rgb.b;
  float k = min(min(c, m), y);

  // CMYK halftone at different angles
  float cDot = halftone(fragCoord, 0.261, c - k, dotSize);
  float mDot = halftone(fragCoord, 1.309, m - k, dotSize);
  float yDot = halftone(fragCoord, 0.0, y - k, dotSize);
  float kDot = halftone(fragCoord, 0.785, k, dotSize);

  // Combine: subtract from white
  vec3 result = vec3(1.0);
  result -= vec3(0.0, 1.0, 1.0) * cDot; // Cyan removes R
  result -= vec3(1.0, 0.0, 1.0) * mDot; // Magenta removes G
  result -= vec3(1.0, 1.0, 0.0) * yDot; // Yellow removes B
  result -= vec3(1.0) * kDot;            // Black removes all

  gl_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}`;
}
