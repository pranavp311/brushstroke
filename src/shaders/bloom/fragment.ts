export function bloomBrightPassFragment(threshold: number): string {
  return `
uniform sampler2D tDiffuse;
uniform float uThreshold;
varying vec2 vUv;

float luminance(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  float lum = luminance(color.rgb);
  float contrib = max(0.0, lum - ${threshold.toFixed(2)});
  contrib /= max(lum, 0.0001);
  gl_FragColor = vec4(color.rgb * contrib, 1.0);
}`;
}

export function bloomBlurFragment(horizontal: boolean, radius: number): string {
  const dir = horizontal ? "vec2(1.0, 0.0)" : "vec2(0.0, 1.0)";
  return `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 texelSize = 1.0 / uResolution;
  vec2 direction = ${dir};
  vec3 result = vec3(0.0);
  float totalWeight = 0.0;

  for (int i = -${radius}; i <= ${radius}; i++) {
    float fi = float(i);
    float weight = exp(-0.5 * (fi * fi) / ${(radius * 0.4).toFixed(1)});
    vec2 offset = direction * texelSize * fi;
    result += texture2D(tDiffuse, vUv + offset).rgb * weight;
    totalWeight += weight;
  }

  gl_FragColor = vec4(result / totalWeight, 1.0);
}`;
}

export function bloomCompositeFragment(intensity: number): string {
  return `
uniform sampler2D tDiffuse;
uniform sampler2D tBloom;
varying vec2 vUv;

void main() {
  vec4 original = texture2D(tDiffuse, vUv);
  vec4 bloom = texture2D(tBloom, vUv);
  gl_FragColor = original + bloom * ${intensity.toFixed(2)};
}`;
}
