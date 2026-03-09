export function edgeDetectionFragment(opts: { method: "sobel" | "roberts" | "prewitt"; threshold: number; lineColor: string; backgroundColor: string }): string {
  const kernels: Record<string, { x: string; y: string }> = {
    sobel: {
      x: `mat3(-1.0, 0.0, 1.0, -2.0, 0.0, 2.0, -1.0, 0.0, 1.0)`,
      y: `mat3(-1.0, -2.0, -1.0, 0.0, 0.0, 0.0, 1.0, 2.0, 1.0)`,
    },
    roberts: {
      x: `mat3(0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, -1.0)`,
      y: `mat3(0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, -1.0, 0.0)`,
    },
    prewitt: {
      x: `mat3(-1.0, 0.0, 1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0)`,
      y: `mat3(-1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0)`,
    },
  };

  const k = kernels[opts.method];

  return `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
varying vec2 vUv;

float luminance(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main() {
  vec2 texelSize = 1.0 / uResolution;

  // Sample 3x3 neighborhood
  float tl = luminance(texture2D(tDiffuse, vUv + vec2(-1.0, -1.0) * texelSize).rgb);
  float tc = luminance(texture2D(tDiffuse, vUv + vec2( 0.0, -1.0) * texelSize).rgb);
  float tr = luminance(texture2D(tDiffuse, vUv + vec2( 1.0, -1.0) * texelSize).rgb);
  float ml = luminance(texture2D(tDiffuse, vUv + vec2(-1.0,  0.0) * texelSize).rgb);
  float mr = luminance(texture2D(tDiffuse, vUv + vec2( 1.0,  0.0) * texelSize).rgb);
  float bl = luminance(texture2D(tDiffuse, vUv + vec2(-1.0,  1.0) * texelSize).rgb);
  float bc = luminance(texture2D(tDiffuse, vUv + vec2( 0.0,  1.0) * texelSize).rgb);
  float br = luminance(texture2D(tDiffuse, vUv + vec2( 1.0,  1.0) * texelSize).rgb);

  mat3 kx = ${k.x};
  mat3 ky = ${k.y};

  float gx = kx[0][0]*tl + kx[0][2]*tr + kx[1][0]*ml + kx[1][2]*mr + kx[2][0]*bl + kx[2][2]*br;
  gx += kx[0][1]*tc + kx[2][1]*bc;
  float gy = ky[0][0]*tl + ky[0][2]*tr + ky[1][0]*ml + ky[1][2]*mr + ky[2][0]*bl + ky[2][2]*br;
  gy += ky[0][1]*tc + ky[2][1]*bc;

  float edge = sqrt(gx * gx + gy * gy);
  float threshold = ${opts.threshold.toFixed(3)};

  vec3 lineColor = ${opts.lineColor};
  vec3 bgColor = ${opts.backgroundColor};

  vec3 color = mix(bgColor, lineColor, step(threshold, edge));
  gl_FragColor = vec4(color, 1.0);
}`;
}
