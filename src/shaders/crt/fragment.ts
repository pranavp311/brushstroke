export function crtFragment(opts: { scanlineIntensity: number; curvature: number; vignetteStrength: number; chromaticAberration: number }): string {
  return `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

vec2 curveUV(vec2 uv, float curvature) {
  uv = uv * 2.0 - 1.0;
  vec2 offset = abs(uv.yx) / vec2(curvature);
  uv = uv + uv * offset * offset;
  uv = uv * 0.5 + 0.5;
  return uv;
}

void main() {
  float curvature = ${opts.curvature.toFixed(1)};
  vec2 curved = curveUV(vUv, curvature);

  // Out of bounds check
  if (curved.x < 0.0 || curved.x > 1.0 || curved.y < 0.0 || curved.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // Chromatic aberration
  float aberration = ${opts.chromaticAberration.toFixed(4)};
  float r = texture2D(tDiffuse, curved + vec2(aberration, 0.0)).r;
  float g = texture2D(tDiffuse, curved).g;
  float b = texture2D(tDiffuse, curved - vec2(aberration, 0.0)).b;
  vec3 color = vec3(r, g, b);

  // Scanlines
  float scanline = sin(curved.y * uResolution.y * 3.14159) * ${opts.scanlineIntensity.toFixed(2)};
  color *= 1.0 - scanline * 0.5;

  // Vignette
  vec2 vig = curved * (1.0 - curved);
  float vigAmount = vig.x * vig.y * 15.0;
  vigAmount = pow(vigAmount, ${opts.vignetteStrength.toFixed(2)});
  color *= vigAmount;

  // Subtle flicker
  color *= 1.0 + sin(uTime * 60.0) * 0.01;

  gl_FragColor = vec4(color, 1.0);
}`;
}
