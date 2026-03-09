export function kuwaharaFragment(opts: { radius: number; sharpness: number }): string {
  return `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
varying vec2 vUv;

float luminance(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main() {
  vec2 texelSize = 1.0 / uResolution;
  int radius = ${opts.radius};

  // Compute mean and variance for 4 quadrants
  vec3 mean[4];
  float variance[4];

  for (int q = 0; q < 4; q++) {
    mean[q] = vec3(0.0);
    variance[q] = 0.0;
  }

  float count = 0.0;
  for (int i = -${opts.radius}; i <= 0; i++) {
    for (int j = -${opts.radius}; j <= 0; j++) {
      vec3 c = texture2D(tDiffuse, vUv + vec2(float(i), float(j)) * texelSize).rgb;
      mean[0] += c;
      variance[0] += luminance(c) * luminance(c);
      count += 1.0;
    }
  }
  mean[0] /= count;
  variance[0] = variance[0] / count - luminance(mean[0]) * luminance(mean[0]);

  count = 0.0;
  for (int i = 0; i <= ${opts.radius}; i++) {
    for (int j = -${opts.radius}; j <= 0; j++) {
      vec3 c = texture2D(tDiffuse, vUv + vec2(float(i), float(j)) * texelSize).rgb;
      mean[1] += c;
      variance[1] += luminance(c) * luminance(c);
      count += 1.0;
    }
  }
  mean[1] /= count;
  variance[1] = variance[1] / count - luminance(mean[1]) * luminance(mean[1]);

  count = 0.0;
  for (int i = -${opts.radius}; i <= 0; i++) {
    for (int j = 0; j <= ${opts.radius}; j++) {
      vec3 c = texture2D(tDiffuse, vUv + vec2(float(i), float(j)) * texelSize).rgb;
      mean[2] += c;
      variance[2] += luminance(c) * luminance(c);
      count += 1.0;
    }
  }
  mean[2] /= count;
  variance[2] = variance[2] / count - luminance(mean[2]) * luminance(mean[2]);

  count = 0.0;
  for (int i = 0; i <= ${opts.radius}; i++) {
    for (int j = 0; j <= ${opts.radius}; j++) {
      vec3 c = texture2D(tDiffuse, vUv + vec2(float(i), float(j)) * texelSize).rgb;
      mean[3] += c;
      variance[3] += luminance(c) * luminance(c);
      count += 1.0;
    }
  }
  mean[3] /= count;
  variance[3] = variance[3] / count - luminance(mean[3]) * luminance(mean[3]);

  // Pick quadrant with lowest variance (most uniform region)
  float sharpness = ${opts.sharpness.toFixed(1)};
  vec3 result = vec3(0.0);
  float totalWeight = 0.0;
  for (int q = 0; q < 4; q++) {
    float w = exp(-variance[q] * sharpness);
    result += mean[q] * w;
    totalWeight += w;
  }
  result /= totalWeight;

  gl_FragColor = vec4(result, 1.0);
}`;
}
