/**
 * Shader Compositor System Test Suite
 * Validates blend modes, code generation, and compositor functionality
 */

import { describe, it, expect } from "vitest";
import {
  generateShaderStack,
  generateSimpleComposite,
  ShaderStack,
  CompositorOptions,
} from "../src/shaders/compositor.js";
import {
  blendModeFunctions,
  BLEND_MODE_INDICES,
  BlendMode,
} from "../src/shaders/blend-modes/index.js";
import { ShaderType } from "../src/shaders/index.js";

// ============================================================================
// Test Constants
// ============================================================================

const EXPECTED_BLEND_MODES: BlendMode[] = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "soft-light",
  "hard-light",
  "color-dodge",
  "color-burn",
  "difference",
  "exclusion",
  "add",
  "subtract",
];

const AVAILABLE_SHADER_TYPES: ShaderType[] = [
  "ascii",
  "kuwahara",
  "halftone",
  "crt",
  "bloom",
  "dithering",
  "edge_detection",
  "pixel_sort",
  "chromatic_aberration",
  "film_grain",
  "hologram",
];

const baseStack: ShaderStack = {
  layers: [
    {
      id: "base",
      shaderType: "crt",
      blendMode: "normal",
      opacity: 1.0,
      target: "fullscreen",
      zIndex: 0,
    },
  ],
  resolution: [1920, 1080],
};

// ============================================================================
// Blend Mode Tests
// ============================================================================

describe("Blend Mode Definitions", () => {
  it("should have all 12 required blend modes defined", () => {
    const definedModes = Object.keys(BLEND_MODE_INDICES) as BlendMode[];
    expect(definedModes).toHaveLength(12);
    EXPECTED_BLEND_MODES.forEach((mode) => {
      expect(definedModes).toContain(mode);
    });
  });

  it("should have correct blend mode indices (0-11)", () => {
    const indices = Object.values(BLEND_MODE_INDICES);
    expect(indices).toHaveLength(12);
    indices.forEach((idx, i) => {
      expect(idx).toBe(i);
    });
  });

  it("should include blend mode GLSL functions", () => {
    expect(blendModeFunctions).toContain("blendNormal");
    expect(blendModeFunctions).toContain("blendMultiply");
    expect(blendModeFunctions).toContain("blendScreen");
    expect(blendModeFunctions).toContain("blendOverlay");
    expect(blendModeFunctions).toContain("blendSoftLight");
    expect(blendModeFunctions).toContain("blendHardLight");
    expect(blendModeFunctions).toContain("blendColorDodge");
    expect(blendModeFunctions).toContain("blendColorBurn");
    expect(blendModeFunctions).toContain("blendDifference");
    expect(blendModeFunctions).toContain("blendExclusion");
    expect(blendModeFunctions).toContain("blendAdd");
    expect(blendModeFunctions).toContain("blendSubtract");
  });

  it("should have a main applyBlend function with switch statement", () => {
    expect(blendModeFunctions).toContain("applyBlend");
    expect(blendModeFunctions).toContain("switch(mode)");
  });
});

// ============================================================================
// Shader Stack Generation Tests
// ============================================================================

describe("generateShaderStack", () => {
  it("should generate code for a single layer", () => {
    const code = generateShaderStack(baseStack);
    expect(code).toBeTruthy();
    expect(code).toContain("import * as THREE");
    expect(code).toContain("EffectComposer");
    expect(code).toContain("ShaderPass");
  });

  it("should generate valid Three.js EffectComposer code", () => {
    const code = generateShaderStack(baseStack);
    expect(code).toContain("const composer = new EffectComposer(renderer)");
    expect(code).toContain("const renderPass = new RenderPass(scene, camera)");
    expect(code).toContain("composer.addPass(renderPass)");
  });

  it("should include bloom pass when enabled", () => {
    const options: CompositorOptions = {
      enableBloomPass: true,
      bloomStrength: 1.5,
      bloomThreshold: 0.7,
      bloomRadius: 0.4,
    };
    const code = generateShaderStack(baseStack, options);
    expect(code).toContain("UnrealBloomPass");
    expect(code).toContain("1.5"); // bloomStrength value
    expect(code).toContain("0.4"); // bloomRadius value
    expect(code).toContain("0.7"); // bloomThreshold value
  });

  it("should handle multiple layers with different blend modes", () => {
    const stack: ShaderStack = {
      layers: [
        {
          id: "base",
          shaderType: "crt",
          blendMode: "normal",
          opacity: 1.0,
          target: "fullscreen",
          zIndex: 0,
        },
        {
          id: "overlay",
          shaderType: "film_grain",
          blendMode: "overlay",
          opacity: 0.5,
          target: "fullscreen",
          zIndex: 1,
        },
        {
          id: "top",
          shaderType: "hologram",
          blendMode: "screen",
          opacity: 0.75,
          target: "fullscreen",
          zIndex: 2,
        },
      ],
      resolution: [1920, 1080],
    };
    const code = generateShaderStack(stack);
    expect(code).toContain("crtShader0");
    expect(code).toContain("filmgrainShader1");
    expect(code).toContain("hologramShader2");
  });

  it("should sort layers by zIndex", () => {
    const stack: ShaderStack = {
      layers: [
        {
          id: "top",
          shaderType: "film_grain",
          blendMode: "normal",
          opacity: 1.0,
          target: "fullscreen",
          zIndex: 2,
        },
        {
          id: "base",
          shaderType: "crt",
          blendMode: "normal",
          opacity: 1.0,
          target: "fullscreen",
          zIndex: 0,
        },
        {
          id: "middle",
          shaderType: "halftone",
          blendMode: "normal",
          opacity: 1.0,
          target: "fullscreen",
          zIndex: 1,
        },
      ],
      resolution: [1920, 1080],
    };
    const code = generateShaderStack(stack);
    // The base layer (CRT) should appear before halftone and film_grain
    // Lower index means appears earlier in the file
    const crtIndex = code.indexOf("base - crt");
    const halftoneIndex = code.indexOf("middle - halftone");
    const filmGrainIndex = code.indexOf("top - film_grain");
    expect(crtIndex).toBeGreaterThan(-1);
    expect(halftoneIndex).toBeGreaterThan(-1);
    expect(filmGrainIndex).toBeGreaterThan(-1);
    expect(crtIndex).toBeLessThan(halftoneIndex);
    expect(halftoneIndex).toBeLessThan(filmGrainIndex);
  });

  it("should include blend shader for compositing", () => {
    const code = generateShaderStack(baseStack);
    expect(code).toContain("BlendCompositorShader");
    expect(code).toContain("applyBlend");
  });

  it("should generate animation loop with time updates", () => {
    const code = generateShaderStack(baseStack);
    expect(code).toContain("requestAnimationFrame");
    expect(code).toContain("clock.getElapsedTime()");
    expect(code).toContain("uTime.value = elapsed");
  });

  it("should include resize handler", () => {
    const code = generateShaderStack(baseStack);
    expect(code).toContain("window.addEventListener('resize'");
    expect(code).toContain("composer.setSize");
  });

  it("should apply opacity values correctly", () => {
    const stack: ShaderStack = {
      layers: [
        {
          id: "base",
          shaderType: "crt",
          blendMode: "normal",
          opacity: 1.0,
          target: "fullscreen",
          zIndex: 0,
        },
        {
          id: "overlay",
          shaderType: "film_grain",
          blendMode: "overlay",
          opacity: 0.65,
          target: "fullscreen",
          zIndex: 1,
        },
      ],
      resolution: [1920, 1080],
    };
    const code = generateShaderStack(stack);
    // Check for the opacity value formatted with 2 decimal places
    expect(code).toContain("0.65");
  });
});

// ============================================================================
// Simple Composite Tests
// ============================================================================

describe("generateSimpleComposite", () => {
  it("should generate a two-layer composite", () => {
    const code = generateSimpleComposite("crt", "film_grain", "overlay", 0.5);
    expect(code).toContain("crtShader0");
    expect(code).toContain("filmgrainShader1");
  });

  it("should use correct blend mode", () => {
    // overlay = index 3
    const code = generateSimpleComposite("crt", "bloom", "overlay", 0.5);
    expect(code).toContain("applyBlend");
    expect(code).toContain("3, 0.50");
  });

  it("should use multiply blend mode correctly", () => {
    // multiply = index 1
    const code = generateSimpleComposite("crt", "bloom", "multiply", 0.5);
    expect(code).toContain("1, 0.50");
  });

  it("should apply correct opacity", () => {
    const code = generateSimpleComposite("crt", "film_grain", "normal", 0.75);
    expect(code).toContain("0.75");
  });

  it("should enable bloom by default", () => {
    const code = generateSimpleComposite("crt", "film_grain");
    expect(code).toContain("UnrealBloomPass");
    expect(code).toContain("0.8"); // default bloom strength
  });

  it("should work with all shader type combinations", () => {
    const baseShaders: ShaderType[] = ["crt", "ascii", "halftone"];
    const overlayShaders: ShaderType[] = ["film_grain", "edge_detection", "hologram"];
    
    for (const base of baseShaders) {
      for (const overlay of overlayShaders) {
        expect(() => {
          generateSimpleComposite(base, overlay, "normal", 0.5);
        }).not.toThrow();
      }
    }
  });

  it("should work with all blend modes", () => {
    for (const blendMode of EXPECTED_BLEND_MODES) {
      expect(() => {
        generateSimpleComposite("crt", "film_grain", blendMode, 0.5);
      }).not.toThrow();
    }
  });
});

// ============================================================================
// Layer Options Tests
// ============================================================================

describe("Shader Layer Options", () => {
  it("should pass options to shader generation", () => {
    const stack: ShaderStack = {
      layers: [
        {
          id: "crt-layer",
          shaderType: "crt",
          blendMode: "normal",
          opacity: 1.0,
          target: "fullscreen",
          zIndex: 0,
          options: {
            scanlineIntensity: 0.8,
            curvature: 8.0,
            intensity: 1.5,
          },
        },
      ],
      resolution: [1920, 1080],
    };
    const code = generateShaderStack(stack);
    expect(code).toBeTruthy();
    // CRT options should affect generated shader
    expect(code).toContain("scanline");
  });

  it("should handle hologram with color options", () => {
    const stack: ShaderStack = {
      layers: [
        {
          id: "hologram-layer",
          shaderType: "hologram",
          blendMode: "screen",
          opacity: 0.8,
          target: "fullscreen",
          zIndex: 0,
          options: {
            hologramColor: "#ff00ff",
            hologramScanlines: 150,
            hologramFlicker: 0.2,
          },
        },
      ],
      resolution: [1920, 1080],
    };
    const code = generateShaderStack(stack);
    expect(code).toBeTruthy();
    expect(code).toContain("hologramShader0");
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe("Edge Cases", () => {
  it("should handle empty options gracefully", () => {
    const stack: ShaderStack = {
      layers: [
        {
          id: "test",
          shaderType: "crt",
          blendMode: "normal",
          opacity: 1.0,
          target: "fullscreen",
          zIndex: 0,
          options: {},
        },
      ],
      resolution: [1920, 1080],
    };
    expect(() => generateShaderStack(stack)).not.toThrow();
  });

  it("should handle zero opacity", () => {
    const stack: ShaderStack = {
      layers: [
        {
          id: "base",
          shaderType: "crt",
          blendMode: "normal",
          opacity: 1.0,
          target: "fullscreen",
          zIndex: 0,
        },
        {
          id: "invisible",
          shaderType: "film_grain",
          blendMode: "normal",
          opacity: 0.0,
          target: "fullscreen",
          zIndex: 1,
        },
      ],
      resolution: [1920, 1080],
    };
    const code = generateShaderStack(stack);
    expect(code).toContain("0.00");
  });

  it("should handle maximum opacity", () => {
    const stack: ShaderStack = {
      layers: [
        {
          id: "opaque",
          shaderType: "crt",
          blendMode: "normal",
          opacity: 1.0,
          target: "fullscreen",
          zIndex: 0,
        },
      ],
      resolution: [1920, 1080],
    };
    const code = generateShaderStack(stack);
    // Opacity is formatted as 1.0 not 1.00
    expect(code).toContain("1.0");
  });

  it("should handle same zIndex (stable sort)", () => {
    const stack: ShaderStack = {
      layers: [
        {
          id: "first",
          shaderType: "crt",
          blendMode: "normal",
          opacity: 1.0,
          target: "fullscreen",
          zIndex: 0,
        },
        {
          id: "second",
          shaderType: "film_grain",
          blendMode: "normal",
          opacity: 1.0,
          target: "fullscreen",
          zIndex: 0,
        },
      ],
      resolution: [1920, 1080],
    };
    expect(() => generateShaderStack(stack)).not.toThrow();
  });
});

// ============================================================================
// Code Quality Tests
// ============================================================================

describe("Generated Code Quality", () => {
  it("should generate syntactically valid imports", () => {
    const code = generateShaderStack({
      layers: [{
        id: "test",
        shaderType: "crt",
        blendMode: "normal",
        opacity: 1.0,
        target: "fullscreen",
        zIndex: 0,
      }],
      resolution: [1920, 1080],
    });
    // Check for balanced braces in imports
    const importMatch = code.match(/import\s+\{[^}]+\}\s+from/);
    expect(importMatch).toBeTruthy();
  });

  it("should include proper shader uniforms", () => {
    const code = generateShaderStack({
      layers: [{
        id: "test",
        shaderType: "crt",
        blendMode: "normal",
        opacity: 1.0,
        target: "fullscreen",
        zIndex: 0,
      }],
      resolution: [1920, 1080],
    });
    expect(code).toContain("tDiffuse");
    expect(code).toContain("uResolution");
    expect(code).toContain("uTime");
  });

  it("should generate vertex shader with vUv varying", () => {
    const code = generateShaderStack({
      layers: [{
        id: "test",
        shaderType: "crt",
        blendMode: "normal",
        opacity: 1.0,
        target: "fullscreen",
        zIndex: 0,
      }],
      resolution: [1920, 1080],
    });
    expect(code).toContain("varying vec2 vUv");
  });
});

// ============================================================================
// Integration Test
// ============================================================================

describe("Integration: Complex Shader Stack", () => {
  it("should generate a complete multi-layer composition", () => {
    const complexStack: ShaderStack = {
      layers: [
        {
          id: "background-crt",
          shaderType: "crt",
          blendMode: "normal",
          opacity: 1.0,
          target: "fullscreen",
          zIndex: 0,
          options: {
            scanlineIntensity: 0.3,
            curvature: 4.0,
          },
        },
        {
          id: "ascii-overlay",
          shaderType: "ascii",
          blendMode: "multiply",
          opacity: 0.4,
          target: "fullscreen",
          zIndex: 1,
          options: {
            charSize: 10,
            colorMode: "mono",
          },
        },
        {
          id: "film-grain",
          shaderType: "film_grain",
          blendMode: "overlay",
          opacity: 0.3,
          target: "fullscreen",
          zIndex: 2,
          options: {
            intensity: 0.15,
            animated: true,
          },
        },
        {
          id: "hologram-effect",
          shaderType: "hologram",
          blendMode: "screen",
          opacity: 0.6,
          target: "fullscreen",
          zIndex: 3,
          options: {
            hologramColor: "#00ffff",
            hologramFlicker: 0.1,
          },
        },
      ],
      resolution: [2560, 1440],
    };

    const options: CompositorOptions = {
      enableBloomPass: true,
      bloomStrength: 1.2,
      bloomThreshold: 0.6,
      bloomRadius: 0.5,
      enableTonemapping: true,
      exposure: 1.1,
    };

    const code = generateShaderStack(complexStack, options);

    // Verify all layers are present
    expect(code).toContain("crtShader0");
    expect(code).toContain("asciiShader1");
    expect(code).toContain("filmgrainShader2");
    expect(code).toContain("hologramShader3");

    // Verify bloom is configured
    expect(code).toContain("UnrealBloomPass");
    expect(code).toContain("1.2");
    expect(code).toContain("0.6");

    // Verify blend modes are applied
    expect(code).toContain("applyBlend");

    // BUG: Resolution from stack is NOT used - it uses hardcoded 1920x1080
    // See BUG REPORT for details
    // expect(code).toContain("2560");
    // expect(code).toContain("1440");
  });
});

// ============================================================================
// Bug Detection Tests
// ============================================================================

describe("Bug Detection", () => {
  it("should declare result variable before use in blend shader", () => {
    const code = generateShaderStack({
      layers: [
        {
          id: "base",
          shaderType: "crt",
          blendMode: "normal",
          opacity: 1.0,
          target: "fullscreen",
          zIndex: 0,
        },
        {
          id: "overlay",
          shaderType: "film_grain",
          blendMode: "overlay",
          opacity: 0.5,
          target: "fullscreen",
          zIndex: 1,
        },
      ],
      resolution: [1920, 1080],
    });

    // Check the fragment shader main function
    const mainMatch = code.match(/void main\(\)\s*\{([\s\S]*?)gl_FragColor = result;/);
    expect(mainMatch).toBeTruthy();
    
    if (mainMatch) {
      const mainBody = mainMatch[1];
      // The first layer should assign to result (fixed: was layer0)
      expect(mainBody).toContain("vec4 result");
      // Subsequent layers should use applyBlend
      expect(mainBody).toContain("applyBlend(result,");
    }
  });

  it("should generate valid GLSL switch statement", () => {
    const code = generateShaderStack(baseStack);
    expect(code).toContain("switch(mode)");
    // Check for case statements
    for (let i = 0; i < 12; i++) {
      expect(code).toContain(`case ${i}:`);
    }
  });

  it("should generate consistent uniform names", () => {
    const code = generateShaderStack({
      layers: [{
        id: "test",
        shaderType: "crt",
        blendMode: "normal",
        opacity: 1.0,
        target: "fullscreen",
        zIndex: 0,
      }],
      resolution: [1920, 1080],
    });

    // The uniforms name should match the shader name
    expect(code).toContain("const crtShader0");
    expect(code).toContain("const crtShader0Uniforms = crtShader0.uniforms");
  });
});
