/**
 * Blend mode shaders for shader compositing
 * Based on standard Photoshop blend modes adapted for GLSL
 */

export const blendModeFunctions = `
// Blend mode functions
vec3 blendNormal(vec3 base, vec3 blend) {
  return blend;
}

vec3 blendMultiply(vec3 base, vec3 blend) {
  return base * blend;
}

vec3 blendScreen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 blendOverlay(vec3 base, vec3 blend) {
  return mix(
    2.0 * base * blend,
    1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
    step(0.5, base)
  );
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
  return mix(
    2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
    sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
    step(0.5, blend)
  );
}

vec3 blendHardLight(vec3 base, vec3 blend) {
  return blendOverlay(blend, base);
}

vec3 blendColorDodge(vec3 base, vec3 blend) {
  return base / (1.0 - blend + 0.0001);
}

vec3 blendColorBurn(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) / (blend + 0.0001);
}

vec3 blendDifference(vec3 base, vec3 blend) {
  return abs(base - blend);
}

vec3 blendExclusion(vec3 base, vec3 blend) {
  return base + blend - 2.0 * base * blend;
}

vec3 blendAdd(vec3 base, vec3 blend) {
  return min(base + blend, 1.0);
}

vec3 blendSubtract(vec3 base, vec3 blend) {
  return max(base - blend, 0.0);
}

// Main blend function
vec4 applyBlend(vec4 base, vec4 blend, int mode, float opacity) {
  vec3 result;
  
  switch(mode) {
    case 0: result = blendNormal(base.rgb, blend.rgb); break;
    case 1: result = blendMultiply(base.rgb, blend.rgb); break;
    case 2: result = blendScreen(base.rgb, blend.rgb); break;
    case 3: result = blendOverlay(base.rgb, blend.rgb); break;
    case 4: result = blendSoftLight(base.rgb, blend.rgb); break;
    case 5: result = blendHardLight(base.rgb, blend.rgb); break;
    case 6: result = blendColorDodge(base.rgb, blend.rgb); break;
    case 7: result = blendColorBurn(base.rgb, blend.rgb); break;
    case 8: result = blendDifference(base.rgb, blend.rgb); break;
    case 9: result = blendExclusion(base.rgb, blend.rgb); break;
    case 10: result = blendAdd(base.rgb, blend.rgb); break;
    case 11: result = blendSubtract(base.rgb, blend.rgb); break;
    default: result = blendNormal(base.rgb, blend.rgb); break;
  }
  
  return mix(base, vec4(result, blend.a), blend.a * opacity);
}
`;

export type BlendMode = 
  | "normal" 
  | "multiply" 
  | "screen" 
  | "overlay" 
  | "soft-light" 
  | "hard-light"
  | "color-dodge"
  | "color-burn"
  | "difference"
  | "exclusion"
  | "add"
  | "subtract";

export const BLEND_MODE_INDICES: Record<BlendMode, number> = {
  "normal": 0,
  "multiply": 1,
  "screen": 2,
  "overlay": 3,
  "soft-light": 4,
  "hard-light": 5,
  "color-dodge": 6,
  "color-burn": 7,
  "difference": 8,
  "exclusion": 9,
  "add": 10,
  "subtract": 11,
};
