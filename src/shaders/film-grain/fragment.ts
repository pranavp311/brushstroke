export function filmGrainFragment(opts: {
  intensity: number;
  size: number;
  animated: boolean;
}): string {
  return `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

// Pseudo-random function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  
  // Generate grain
  ${opts.animated 
    ? `float grain = random(vUv * ${opts.size.toFixed(1)} + uTime * 0.01);`
    : `float grain = random(vUv * ${opts.size.toFixed(1)});`
  }
  
  // Center the grain around 0
  grain = (grain - 0.5) * ${opts.intensity.toFixed(2)};
  
  // Apply grain to color
  gl_FragColor = vec4(color.rgb + grain, color.a);
}`;
}
