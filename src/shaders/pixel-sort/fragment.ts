export function pixelSortFragment(opts: { direction: "horizontal" | "vertical"; threshold: number; sortRange: number }): string {
  const isHorizontal = opts.direction === "horizontal";
  const axis = isHorizontal ? "x" : "y";
  const otherAxis = isHorizontal ? "y" : "x";

  return `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uTime;
varying vec2 vUv;

float luminance(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main() {
  vec2 texelSize = 1.0 / uResolution;
  vec4 currentColor = texture2D(tDiffuse, vUv);
  float currentLum = luminance(currentColor.rgb);

  float threshold = ${opts.threshold.toFixed(3)};

  // Only sort pixels above threshold
  if (currentLum < threshold) {
    gl_FragColor = currentColor;
    return;
  }

  // GPU approximation of pixel sorting: compare with neighbors and bubble sort step
  int sortRange = ${opts.sortRange};
  vec3 sorted = currentColor.rgb;
  float sortedLum = currentLum;

  for (int i = 1; i <= ${opts.sortRange}; i++) {
    float fi = float(i);
    vec2 offset = vec2(0.0);
    offset.${axis} = fi * texelSize.${axis};

    vec4 neighborColor = texture2D(tDiffuse, vUv + offset);
    float neighborLum = luminance(neighborColor.rgb);

    // Swap if neighbor is brighter (sort ascending along axis)
    if (neighborLum > threshold && neighborLum < sortedLum) {
      sorted = neighborColor.rgb;
      sortedLum = neighborLum;
    }

    neighborColor = texture2D(tDiffuse, vUv - offset);
    neighborLum = luminance(neighborColor.rgb);

    if (neighborLum > threshold && neighborLum > sortedLum) {
      sorted = neighborColor.rgb;
      sortedLum = neighborLum;
    }
  }

  // Animated blend
  float blend = sin(uTime * 2.0) * 0.5 + 0.5;
  gl_FragColor = vec4(mix(currentColor.rgb, sorted, blend * 0.7), 1.0);
}`;
}
