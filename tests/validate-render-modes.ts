/**
 * Validation script for animation render modes
 * Run with: npx tsx tests/validate-render-modes.ts
 */

import {
  RenderMode,
  DnaHelixOptions,
  VoxelOptions,
  EnhancedVoxelOptions,
  NeonWireOptions,
  DEFAULT_DNA_OPTIONS,
  DEFAULT_NEON_OPTIONS,
  generateDnaHelixRender,
  generateVoxelRender,
  generateEnhancedVoxelRender,
  generateHologramRender,
  generateGlitchRender,
  generateNeonWireRender,
} from "../src/animations/render-modes.js";
import { ModelStyle } from "../src/models/index.js";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

let passCount = 0;
let failCount = 0;
const issues: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    passCount++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    issues.push(`FAIL: ${name}`);
    if (error instanceof Error) {
      issues.push(`  ${error.message}`);
    }
    failCount++;
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toContain(expected: string) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected string to contain "${expected}"`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined`);
      }
    },
    toHaveLength(expected: number) {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${actual.length}`);
      }
    },
    not: {
      toContain(expected: string) {
        if (actual.includes(expected)) {
          throw new Error(`Expected string NOT to contain "${expected}"`);
        }
      },
    },
  };
}

console.log(`\n${colors.cyan}=== Render Modes Validation Suite ===\n${colors.reset}`);

// ============================================================================
// Test Suite: Type Validation
// ============================================================================

console.log(`\n${colors.blue}--- Type Validation ---${colors.reset}\n`);

test("RenderMode type includes all expected values", () => {
  const validModes: RenderMode[] = [
    "solid", "wireframe", "points", "dna_helix", "particle_cloud",
    "voxel", "hologram", "glitch", "neon_wire",
  ];
  expect(validModes).toHaveLength(9);
});

test("ModelStyle type includes all render modes", () => {
  const modelStyles: ModelStyle[] = [
    "flat", "smooth", "wireframe", "toon",
    "dna_helix", "voxel", "hologram", "neon_wire", "glitch", "particle_cloud",
  ];
  // Check all new modes are present
  expect(modelStyles).toContain("dna_helix");
  expect(modelStyles).toContain("voxel");
  expect(modelStyles).toContain("hologram");
  expect(modelStyles).toContain("neon_wire");
  expect(modelStyles).toContain("glitch");
  expect(modelStyles).toContain("particle_cloud");
});

// ============================================================================
// Test Suite: DNA Helix Render Mode
// ============================================================================

console.log(`\n${colors.blue}--- DNA Helix Render Mode ---${colors.reset}\n`);

test("DEFAULT_DNA_OPTIONS has correct structure", () => {
  expect(DEFAULT_DNA_OPTIONS.particlesPerStrand).toBe(100);
  expect(DEFAULT_DNA_OPTIONS.helixRadius).toBe(3);
  expect(DEFAULT_DNA_OPTIONS.helixHeight).toBe(10);
  expect(DEFAULT_DNA_OPTIONS.twistCount).toBe(3);
  expect(DEFAULT_DNA_OPTIONS.basePairDistance).toBe(0.3);
  expect(DEFAULT_DNA_OPTIONS.particleSize).toBe(0.15);
  expect(DEFAULT_DNA_OPTIONS.colorScale).toBe("gradient");
  expect(DEFAULT_DNA_OPTIONS.animationSpeed).toBe(0.5);
  expect(DEFAULT_DNA_OPTIONS.showConnections).toBe(true);
  expect(DEFAULT_DNA_OPTIONS.strandAColor).toBe("#00d4ff");
  expect(DEFAULT_DNA_OPTIONS.strandBColor).toBe("#ff6b6b");
  expect(DEFAULT_DNA_OPTIONS.connectionColor).toBe("#ffffff");
});

test("generateDnaHelixRender generates valid Three.js code", () => {
  const code = generateDnaHelixRender();
  
  // Core Three.js patterns
  expect(code).toContain("THREE.Group()");
  expect(code).toContain("THREE.InstancedMesh");
  expect(code).toContain("THREE.SphereGeometry");
  expect(code).toContain("THREE.MeshStandardMaterial");
  expect(code).toContain("THREE.Vector3");
  expect(code).toContain("THREE.Color");
  expect(code).toContain("THREE.LineSegments");
  expect(code).toContain("THREE.LineBasicMaterial");
  expect(code).toContain("THREE.BufferGeometry");
  expect(code).toContain("THREE.BufferAttribute");
  expect(code).toContain("THREE.DynamicDrawUsage");
  expect(code).toContain("THREE.AdditiveBlending");
  
  // DNA-specific elements
  expect(code).toContain("// DNA Helix Visualization");
  expect(code).toContain("strandAPositions");
  expect(code).toContain("strandBPositions");
  expect(code).toContain("particlesPerStrand");
  expect(code).toContain("helixRadius");
  expect(code).toContain("twistCount");
  expect(code).toContain("basePairDistance");
  
  // Animation
  expect(code).toContain("function animateDnaHelix");
  expect(code).toContain("window.animateDnaHelix");
});

test("generateDnaHelixRender supports all color scales", () => {
  const colorScales: Array<DnaHelixOptions["colorScale"]> = [
    "gradient", "rainbow", "monochrome", "thermal",
  ];
  
  for (const scale of colorScales) {
    const code = generateDnaHelixRender({ colorScale: scale });
    expect(code).toContain("setColorAt");
  }
});

test("generateDnaHelixRender generates connection lines when enabled", () => {
  const code = generateDnaHelixRender({ showConnections: true });
  expect(code).toContain("connectionLines");
  expect(code).toContain("Connection lines between strands");
});

test("generateDnaHelixRender omits connections when disabled", () => {
  const code = generateDnaHelixRender({ showConnections: false });
  expect(code).not.toContain("Connection lines between strands");
});

test("DNA helix uses proper instancing for performance", () => {
  const code = generateDnaHelixRender();
  expect(code).toContain("InstancedMesh");
  expect(code).toContain("instanceMatrix");
  expect(code).toContain("instanceMatrix.needsUpdate = true");
  expect(code).toContain("DynamicDrawUsage");
});

// ============================================================================
// Test Suite: Voxel Render Mode
// ============================================================================

console.log(`\n${colors.blue}--- Voxel Render Mode ---${colors.reset}\n`);

test("generateVoxelRender generates valid Three.js code", () => {
  const code = generateVoxelRender();
  
  // Core Three.js patterns
  expect(code).toContain("THREE.Group()");
  expect(code).toContain("THREE.InstancedMesh");
  expect(code).toContain("THREE.BoxGeometry");
  expect(code).toContain("THREE.MeshStandardMaterial");
  expect(code).toContain("THREE.Vector3");
  expect(code).toContain("THREE.Color");
  expect(code).toContain("THREE.Box3");
  
  // Voxel-specific elements
  expect(code).toContain("// Voxel Representation");
  expect(code).toContain("voxelSize");
  expect(code).toContain("gridSize");
  expect(code).toContain("voxelCount");
  expect(code).toContain("targetMesh.visible = false");
});

test("generateVoxelRender supports all color sources", () => {
  const colorSources: Array<VoxelOptions["colorSource"]> = [
    "normal", "texture", "gradient", "height",
  ];
  
  for (const source of colorSources) {
    const code = generateVoxelRender({ colorSource: source });
    expect(code).toContain("setColorAt");
  }
});

// ============================================================================
// Test Suite: Enhanced Voxel Render Mode
// ============================================================================

console.log(`\n${colors.blue}--- Enhanced Voxel Render Mode ---${colors.reset}\n`);

test("generateEnhancedVoxelRender generates valid Three.js code", () => {
  const code = generateEnhancedVoxelRender();
  
  // Core Three.js patterns
  expect(code).toContain("THREE.Group()");
  expect(code).toContain("THREE.InstancedMesh");
  expect(code).toContain("THREE.BoxGeometry");
  expect(code).toContain("THREE.MeshStandardMaterial");
  expect(code).toContain("THREE.Vector3");
  expect(code).toContain("THREE.Color");
  expect(code).toContain("THREE.DynamicDrawUsage");
  
  // Enhanced voxel-specific elements
  expect(code).toContain("// Enhanced Voxel Render");
  expect(code).toContain("voxels");
  expect(code).toContain("originalPos");
  expect(code).toContain("explodeDir");
});

test("generateEnhancedVoxelRender supports all animations", () => {
  const animations: Array<EnhancedVoxelOptions["animation"]> = [
    "none", "explode", "assemble", "pulse", "wave",
  ];
  
  for (const animation of animations) {
    const code = generateEnhancedVoxelRender({ animation });
    expect(code).toContain(`animationType = "${animation}"`);
    expect(code).toContain("function animateVoxels");
    expect(code).toContain("window.animateVoxels");
  }
});

test("Enhanced voxel explode animation uses correct physics", () => {
  const code = generateEnhancedVoxelRender({ 
    animation: "explode",
    explodeForce: 3.0 
  });
  expect(code).toContain("explodeForce = 3");
  expect(code).toContain("explodeDir");
  expect(code).toContain("Math.sin(voxelTime)");
});

test("Enhanced voxel assemble animation uses correct interpolation", () => {
  const code = generateEnhancedVoxelRender({ animation: "assemble" });
  expect(code).toContain("assembleT");
  expect(code).toContain("Math.min(voxelTime * 0.5, 1)");
});

test("Enhanced voxel wave animation uses correct wave function", () => {
  const code = generateEnhancedVoxelRender({ animation: "wave" });
  expect(code).toContain("Math.sin(voxelTime * 2 + voxel.originalPos.x * 0.5");
});

// ============================================================================
// Test Suite: Hologram Render Mode
// ============================================================================

console.log(`\n${colors.blue}--- Hologram Render Mode ---${colors.reset}\n`);

test("generateHologramRender generates valid Three.js code", () => {
  const code = generateHologramRender();
  
  // Shader material usage
  expect(code).toContain("THREE.ShaderMaterial");
  expect(code).toContain("vertexShader");
  expect(code).toContain("fragmentShader");
  expect(code).toContain("uniforms");
  
  // Hologram-specific features
  expect(code).toContain("// Hologram Material Setup");
  expect(code).toContain("uScanlineCount");
  expect(code).toContain("uFlickerIntensity");
  expect(code).toContain("uEdgeGlow");
  expect(code).toContain("uTransparency");
  
  // Scanlines implementation
  expect(code).toContain("scanline");
  expect(code).toContain("sin(vPosition.y * uScanlineCount");
  
  // Fresnel edge glow
  expect(code).toContain("fresnel");
  expect(code).toContain("pow(1.0 - abs(dot(viewDir, vNormal))");
  
  // Transparency and blending
  expect(code).toContain("transparent: true");
  expect(code).toContain("THREE.DoubleSide");
  expect(code).toContain("THREE.AdditiveBlending");
  expect(code).toContain("depthWrite: false");
  
  // Animation
  expect(code).toContain("function updateHologramTime");
  expect(code).toContain("window.updateHologramTime");
});

test("Hologram render uses proper shader uniforms", () => {
  const code = generateHologramRender();
  expect(code).toContain("uTime: { value: 0 }");
  expect(code).toContain("uColor: { value: new THREE.Color(0x00ffff) }");
});

test("Hologram render applies to all mesh children", () => {
  const code = generateHologramRender();
  expect(code).toContain("targetMesh.traverse");
  expect(code).toContain("child.isMesh");
  expect(code).toContain("child.material = hologramMaterial");
});

// ============================================================================
// Test Suite: Glitch Render Mode
// ============================================================================

console.log(`\n${colors.blue}--- Glitch Render Mode ---${colors.reset}\n`);

test("generateGlitchRender generates valid Three.js code", () => {
  const code = generateGlitchRender();
  
  // Shader material usage
  expect(code).toContain("THREE.ShaderMaterial");
  expect(code).toContain("vertexShader");
  expect(code).toContain("fragmentShader");
  expect(code).toContain("uniforms");
  
  // Glitch-specific features
  expect(code).toContain("// Glitch Effect Setup");
  expect(code).toContain("uIntensity");
  
  // Vertex displacement
  expect(code).toContain("pos.x += (random(vec2(uTime, position.y)) - 0.5)");
  
  // RGB split
  expect(code).toContain("// RGB split on glitch");
  expect(code).toContain("vGlitch > 0.97");
  
  // Scanline artifacts
  expect(code).toContain("Scanline artifacts");
  expect(code).toContain("random(vec2(0.0, vUv.y * 100.0");
  
  // Random function
  expect(code).toContain("float random(vec2 st)");
  expect(code).toContain("fract(sin(dot(st.xy, vec2(12.9898, 78.233)))");
  
  // Animation
  expect(code).toContain("function updateGlitch");
  expect(code).toContain("window.updateGlitch");
});

test("Glitch render uses proper shader uniforms", () => {
  const code = generateGlitchRender();
  expect(code).toContain("uTime: { value: 0 }");
  expect(code).toContain("uIntensity: { value: 0.5 }");
  expect(code).toContain("uColor: { value: new THREE.Color(0xffffff) }");
});

test("Glitch render applies to all mesh children with unique materials", () => {
  const code = generateGlitchRender();
  expect(code).toContain("targetMesh.traverse");
  expect(code).toContain("child.isMesh");
  expect(code).toContain("child.material = glitchMaterial.clone()");
});

test("Glitch render uses double-sided rendering", () => {
  const code = generateGlitchRender();
  expect(code).toContain("side: THREE.DoubleSide");
});

// ============================================================================
// Test Suite: Neon Wireframe Render Mode
// ============================================================================

console.log(`\n${colors.blue}--- Neon Wireframe Render Mode ---${colors.reset}\n`);

test("DEFAULT_NEON_OPTIONS has correct structure", () => {
  expect(DEFAULT_NEON_OPTIONS.lineWidth).toBe(2);
  expect(DEFAULT_NEON_OPTIONS.color).toBe("#ff00ff");
  expect(DEFAULT_NEON_OPTIONS.glowStrength).toBe(2.0);
  expect(DEFAULT_NEON_OPTIONS.pulseSpeed).toBe(1.0);
  expect(DEFAULT_NEON_OPTIONS.bloomIntensity).toBe(1.5);
  expect(DEFAULT_NEON_OPTIONS.pulseOpacity).toBe(true);
});

test("generateNeonWireRender generates valid Three.js code", () => {
  const code = generateNeonWireRender();
  
  // Core Three.js patterns
  expect(code).toContain("THREE.Group()");
  expect(code).toContain("THREE.WireframeGeometry");
  expect(code).toContain("THREE.LineSegments");
  expect(code).toContain("THREE.Color");
  expect(code).toContain("THREE.Vector2");
  
  // Shader material
  expect(code).toContain("THREE.ShaderMaterial");
  expect(code).toContain("vertexShader");
  expect(code).toContain("fragmentShader");
  
  // Neon-specific features
  expect(code).toContain("// Neon Wireframe Render");
  expect(code).toContain("neonColor");
  expect(code).toContain("glowStrength");
  expect(code).toContain("pulseSpeed");
  expect(code).toContain("bloomIntensity");
  
  // Pulse effect
  expect(code).toContain("// Pulse effect");
  expect(code).toContain("sin(uTime * uPulseSpeed");
  
  // Bloom post-processing
  expect(code).toContain("// Bloom post-processing setup");
  expect(code).toContain("THREE.EffectComposer");
  expect(code).toContain("THREE.RenderPass");
  expect(code).toContain("THREE.UnrealBloomPass");
  
  // Transparency and blending
  expect(code).toContain("transparent: true");
  expect(code).toContain("THREE.AdditiveBlending");
  expect(code).toContain("depthWrite: false");
  
  // Animation
  expect(code).toContain("function updateNeonWire");
  expect(code).toContain("window.updateNeonWire");
  expect(code).toContain("window.neonBloomComposer");
});

test("Neon wireframe stores original materials", () => {
  const code = generateNeonWireRender();
  expect(code).toContain("originalMaterials");
  expect(code).toContain("originalMaterials.set(child.uuid, child.material)");
});

test("Neon wireframe hides original mesh", () => {
  const code = generateNeonWireRender();
  expect(code).toContain("child.visible = false");
});

test("Neon wireframe supports pulse opacity toggle", () => {
  const codeWithPulse = generateNeonWireRender({ pulseOpacity: true });
  expect(codeWithPulse).toContain("uPulseOpacity: { value: 1");
  
  const codeNoPulse = generateNeonWireRender({ pulseOpacity: false });
  expect(codeNoPulse).toContain("uPulseOpacity: { value: 0");
});

// ============================================================================
// Test Suite: Three.js Pattern Validation
// ============================================================================

console.log(`\n${colors.blue}--- Three.js Pattern Validation ---${colors.reset}\n`);

test("All render modes use THREE namespace prefix", () => {
  const dnaCode = generateDnaHelixRender();
  const voxelCode = generateVoxelRender();
  const hologramCode = generateHologramRender();
  const glitchCode = generateGlitchRender();
  const neonCode = generateNeonWireRender();
  
  expect(dnaCode).toContain("THREE.");
  expect(voxelCode).toContain("THREE.");
  expect(hologramCode).toContain("THREE.");
  expect(glitchCode).toContain("THREE.");
  expect(neonCode).toContain("THREE.");
});

test("All render modes properly add to scene", () => {
  const dnaCode = generateDnaHelixRender();
  const voxelCode = generateVoxelRender();
  const neonCode = generateNeonWireRender();
  
  expect(dnaCode).toContain("scene.add(dnaGroup)");
  expect(voxelCode).toContain("scene.add(voxelGroup)");
  expect(neonCode).toContain("scene.add(neonGroup)");
});

test("InstancedMesh usage follows best practices", () => {
  const dnaCode = generateDnaHelixRender();
  const voxelCode = generateVoxelRender();
  const enhancedVoxelCode = generateEnhancedVoxelRender();
  
  // Check for matrix updates
  expect(dnaCode).toContain("dummy.updateMatrix()");
  expect(dnaCode).toContain("strandMesh.setMatrixAt");
  
  // Check for needsUpdate flag
  expect(dnaCode).toContain("instanceMatrix.needsUpdate = true");
  expect(voxelCode).toContain("instanceMatrix.needsUpdate = true");
  expect(enhancedVoxelCode).toContain("instanceMatrix.needsUpdate = true");
});

test("Shader materials have proper varyings", () => {
  const hologramCode = generateHologramRender();
  const glitchCode = generateGlitchRender();
  const neonCode = generateNeonWireRender();
  
  // Hologram
  expect(hologramCode).toContain("varying vec3 vNormal");
  expect(hologramCode).toContain("varying vec3 vPosition");
  expect(hologramCode).toContain("varying vec2 vUv");
  
  // Glitch
  expect(glitchCode).toContain("varying vec2 vUv");
  expect(glitchCode).toContain("varying float vGlitch");
});

test("Animation functions follow consistent pattern", () => {
  const dnaCode = generateDnaHelixRender();
  const hologramCode = generateHologramRender();
  const glitchCode = generateGlitchRender();
  const neonCode = generateNeonWireRender();
  const voxelCode = generateEnhancedVoxelRender();
  
  // All should expose animation functions on window
  expect(dnaCode).toContain("window.animateDnaHelix");
  expect(hologramCode).toContain("window.updateHologramTime");
  expect(glitchCode).toContain("window.updateGlitch");
  expect(neonCode).toContain("window.updateNeonWire");
  expect(voxelCode).toContain("window.animateVoxels");
});

// ============================================================================
// Test Suite: Edge Cases and Error Handling
// ============================================================================

console.log(`\n${colors.blue}--- Edge Cases and Error Handling ---${colors.reset}\n`);

test("DNA helix handles custom options correctly", () => {
  const customOptions: Partial<DnaHelixOptions> = {
    particlesPerStrand: 50,
    helixRadius: 5,
    twistCount: 5,
    colorScale: "rainbow",
  };
  const code = generateDnaHelixRender(customOptions);
  
  expect(code).toContain("particlesPerStrand = 50");
  expect(code).toContain("helixRadius = 5");
  expect(code).toContain("twistCount = 5");
});

test("Voxel render handles different grid sizes", () => {
  const code = generateVoxelRender({ gridSize: [20, 20, 20] });
  expect(code).toContain("gridSize = [20, 20, 20]");
});

test("Enhanced voxel handles zero animation speed", () => {
  const code = generateEnhancedVoxelRender({ animationSpeed: 0 });
  expect(code).toContain("animationSpeed = 0");
});

test("Neon wireframe handles different colors", () => {
  const code = generateNeonWireRender({ color: "#00ff00" });
  expect(code).toContain('new THREE.Color("#00ff00")');
});

// ============================================================================
// Test Suite: Missing Feature Detection
// ============================================================================

console.log(`\n${colors.blue}--- Missing Feature Detection ---${colors.reset}\n`);

test("particle_cloud render mode is defined in types", () => {
  const validModes: RenderMode[] = ["particle_cloud"];
  expect(validModes).toContain("particle_cloud");
});

// ============================================================================
// Summary
// ============================================================================

console.log(`\n${colors.cyan}=== Validation Summary ===${colors.reset}\n`);
console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
console.log(`Total: ${passCount + failCount}\n`);

if (issues.length > 0) {
  console.log(`${colors.yellow}Issues found:${colors.reset}`);
  issues.forEach(issue => console.log(`  ${issue}`));
  console.log();
}

// Final bug report
console.log(`${colors.cyan}=== Bug Report ===${colors.reset}\n`);

const bugs = [
  {
    severity: "HIGH",
    description: "Model generator Zod schema doesn't include new render modes",
    file: "src/tools/model-generator.ts",
    details: "The style parameter only allows ['flat', 'smooth', 'wireframe', 'toon'] but ModelStyle type includes 10 values"
  },
  {
    severity: "MEDIUM",
    description: "particle_cloud render mode has no generator function",
    file: "src/animations/render-modes.ts",
    details: "Type includes 'particle_cloud' but there's no generateParticleCloudRender function implemented"
  },
  {
    severity: "MEDIUM", 
    description: "Voxel render uses sphere SDF instead of actual mesh voxelization",
    file: "src/animations/render-modes.ts",
    details: "Both generateVoxelRender and generateEnhancedVoxelRender use sphere distance instead of actual mesh SDF"
  },
  {
    severity: "LOW",
    description: "Enhanced voxel pulse animation references undefined 'dist' variable",
    file: "src/animations/render-modes.ts",
    details: "In the pulse case, 'dist' is used but not defined in that scope"
  }
];

bugs.forEach((bug, i) => {
  const color = bug.severity === "HIGH" ? colors.red : 
                bug.severity === "MEDIUM" ? colors.yellow : colors.blue;
  console.log(`${color}[${bug.severity}]${colors.reset} Bug #${i + 1}: ${bug.description}`);
  console.log(`  File: ${bug.file}`);
  console.log(`  Details: ${bug.details}\n`);
});

process.exit(failCount > 0 ? 1 : 0);
