export function ditheringFragment(opts: { method: "bayer" | "blue_noise"; levels: number; colorize: boolean }): string {
  const bayerMatrix = `
float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a)  { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a)  { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
float bayer16(vec2 a) { return bayer8(0.5 * a) * 0.25 + bayer2(a); }`;

  const blueNoise = `
float blueNoise(vec2 coord) {
  // Interleaved gradient noise (approximation of blue noise)
  return fract(52.9829189 * fract(0.06711056 * coord.x + 0.00583715 * coord.y));
}`;

  const noiseFunc = opts.method === "bayer" ? bayerMatrix : blueNoise;
  const noiseSample = opts.method === "bayer"
    ? "bayer16(fragCoord)"
    : "blueNoise(fragCoord)";

  return `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
varying vec2 vUv;

float luminance(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

${noiseFunc}

void main() {
  vec2 fragCoord = vUv * uResolution;
  vec4 texColor = texture2D(tDiffuse, vUv);
  vec3 color = texColor.rgb;

  float levels = ${opts.levels.toFixed(1)};
  float dither = ${noiseSample} - 0.5;
  dither /= levels;

  ${opts.colorize
    ? `color = floor((color + dither) * levels) / levels;`
    : `float lum = luminance(color);
  lum = floor((lum + dither) * levels) / levels;
  color = vec3(lum);`
  }

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;
}
