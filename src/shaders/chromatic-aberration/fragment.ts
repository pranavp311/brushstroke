export function chromaticAberrationFragment(opts: {
  intensity: number;
  radialFalloff: boolean;
}): string {
  return `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float shift = ${(opts.intensity * 0.01).toFixed(4)};
  
  ${opts.radialFalloff ? `
  // Radial falloff - more aberration at edges
  vec2 center = uv - 0.5;
  float dist = length(center);
  shift *= smoothstep(0.0, 0.7, dist);
  ` : ''}
  
  // Chromatic shift - sample R, G, B at different offsets
  float r = texture2D(tDiffuse, uv + vec2(shift, 0.0)).r;
  float g = texture2D(tDiffuse, uv).g;
  float b = texture2D(tDiffuse, uv - vec2(shift, 0.0)).b;
  
  gl_FragColor = vec4(r, g, b, 1.0);
}`;
}
