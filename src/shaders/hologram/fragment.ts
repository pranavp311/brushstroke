export function hologramFragment(opts: {
  scanlineCount: number;
  flickerIntensity: number;
  rgbShift: number;
  edgeGlow: number;
  transparency: number;
  color: string;
}): string {
  const colorVec = opts.color.startsWith("#")
    ? `vec3(${parseInt(opts.color.slice(1, 3), 16) / 255}, ${parseInt(opts.color.slice(3, 5), 16) / 255}, ${parseInt(opts.color.slice(5, 7), 16) / 255})`
    : `vec3(0.0, 1.0, 1.0)`;

  return `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  
  // Sample original color
  vec4 original = texture2D(tDiffuse, uv);
  
  // Scanlines
  float scanline = sin(uv.y * ${opts.scanlineCount.toFixed(1)} + uTime * 2.0) * 0.5 + 0.5;
  scanline = pow(scanline, 1.5) * 0.3 + 0.7;
  
  // RGB Shift at edges
  float rgbShift = ${opts.rgbShift.toFixed(4)};
  float r = texture2D(tDiffuse, uv + vec2(rgbShift, 0.0)).r;
  float g = texture2D(tDiffuse, uv).g;
  float b = texture2D(tDiffuse, uv - vec2(rgbShift, 0.0)).b;
  vec3 rgbShifted = vec3(r, g, b);
  
  // Edge detection for fresnel-like glow
  vec2 texel = 1.0 / uResolution;
  vec3 center = rgbShifted;
  vec3 left = texture2D(tDiffuse, uv - vec2(texel.x, 0.0)).rgb;
  vec3 right = texture2D(tDiffuse, uv + vec2(texel.x, 0.0)).rgb;
  vec3 up = texture2D(tDiffuse, uv + vec2(0.0, texel.y)).rgb;
  vec3 down = texture2D(tDiffuse, uv - vec2(0.0, texel.y)).rgb;
  
  float edgeH = length(left - right);
  float edgeV = length(up - down);
  float edge = max(edgeH, edgeV);
  
  // Fresnel-like edge glow
  float fresnel = pow(edge * 3.0, ${opts.edgeGlow.toFixed(1)});
  fresnel = clamp(fresnel, 0.0, 1.0);
  
  // Flicker effect
  float flicker = 1.0 - ${opts.flickerIntensity.toFixed(2)} * sin(uTime * 10.0 + random(uv) * 3.14) * 0.5;
  flicker *= 1.0 - ${opts.flickerIntensity.toFixed(2)} * 0.5 * step(0.97, random(vec2(floor(uTime * 20.0), 0.0)));
  
  // Glitch lines
  float glitch = 0.0;
  if (random(vec2(floor(uTime * 5.0), 0.0)) > 0.95) {
    float glitchLine = random(vec2(floor(uTime * 10.0), 1.0));
    glitch = step(abs(uv.y - glitchLine), 0.01) * 0.3;
  }
  
  // Combine effects
  vec3 hologramColor = ${colorVec};
  vec3 finalColor = rgbShifted * scanline * flicker;
  finalColor += hologramColor * fresnel * 2.0;
  finalColor += hologramColor * glitch;
  
  // Transparency based on brightness and fresnel
  float brightness = dot(finalColor, vec3(0.2126, 0.7152, 0.0722));
  float alpha = max(brightness, fresnel) * ${opts.transparency.toFixed(2)};
  alpha = clamp(alpha, 0.0, 1.0);
  
  gl_FragColor = vec4(finalColor, alpha);
}`;
}

export function hologramMaterialFragment(opts: {
  scanlineCount: number;
  flickerIntensity: number;
  rgbShift: number;
  edgeGlow: number;
  transparency: number;
  color: string;
}): string {
  const colorVec = opts.color.startsWith("#")
    ? `vec3(${parseInt(opts.color.slice(1, 3), 16) / 255}, ${parseInt(opts.color.slice(3, 5), 16) / 255}, ${parseInt(opts.color.slice(5, 7), 16) / 255})`
    : `vec3(0.0, 1.0, 1.0)`;

  return `
uniform float uTime;
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  // Scanlines
  float scanline = sin(vPosition.y * ${opts.scanlineCount.toFixed(1)} + uTime * 2.0) * 0.5 + 0.5;
  scanline = pow(scanline, 1.5) * 0.3 + 0.7;
  
  // Fresnel edge glow
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), ${opts.edgeGlow.toFixed(1)});
  fresnel = clamp(fresnel, 0.0, 1.0);
  
  // Flicker effect
  float flicker = 1.0 - ${opts.flickerIntensity.toFixed(2)} * sin(uTime * 10.0 + random(vUv) * 3.14) * 0.5;
  flicker *= 1.0 - ${opts.flickerIntensity.toFixed(2)} * 0.5 * step(0.97, random(vec2(floor(uTime * 20.0), 0.0)));
  
  // Glitch lines
  float glitch = 0.0;
  if (random(vec2(floor(uTime * 5.0), 0.0)) > 0.95) {
    float glitchLine = random(vec2(floor(uTime * 10.0), 1.0));
    glitch = step(abs(vUv.y - glitchLine), 0.01) * 0.3;
  }
  
  // Combine effects
  vec3 baseColor = uColor * scanline * flicker;
  vec3 glowColor = uColor * fresnel * 2.0;
  vec3 glitchColor = uColor * glitch;
  
  vec3 finalColor = baseColor + glowColor + glitchColor;
  
  // Alpha based on fresnel and base brightness
  float alpha = max(fresnel * 0.8 + 0.2, 0.1) * ${opts.transparency.toFixed(2)};
  alpha = clamp(alpha, 0.0, 1.0);
  
  gl_FragColor = vec4(finalColor, alpha);
}`;
}
