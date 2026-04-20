/**
 * Advanced render modes for 3D models
 * 
 * These transform standard 3D meshes into specialized visualizations
 * like DNA helixes, voxel representations, and holographic projections.
 */

export type RenderMode =
  | "solid"
  | "wireframe"
  | "points"
  | "dna_helix"
  | "particle_cloud"
  | "voxel"
  | "hologram"
  | "glitch"
  | "neon_wire";

export interface DnaHelixOptions {
  /** Number of particles per strand */
  particlesPerStrand: number;
  /** Radius of the helix */
  helixRadius: number;
  /** Total height of the helix */
  helixHeight: number;
  /** Number of complete twists */
  twistCount: number;
  /** Distance between base pairs */
  basePairDistance: number;
  /** Size of individual particles */
  particleSize: number;
  /** Color gradient type */
  colorScale: "gradient" | "rainbow" | "monochrome" | "thermal";
  /** Animation speed (0 = static) */
  animationSpeed: number;
  /** Connect strands with lines */
  showConnections: boolean;
  /** Color for strand A */
  strandAColor: string;
  /** Color for strand B */
  strandBColor: string;
  /** Color for connections */
  connectionColor: string;
}

export const DEFAULT_DNA_OPTIONS: DnaHelixOptions = {
  particlesPerStrand: 100,
  helixRadius: 3,
  helixHeight: 10,
  twistCount: 3,
  basePairDistance: 0.3,
  particleSize: 0.15,
  colorScale: "gradient",
  animationSpeed: 0.5,
  showConnections: true,
  strandAColor: "#00d4ff",
  strandBColor: "#ff6b6b",
  connectionColor: "#ffffff",
};

/**
 * Generates Three.js code for a DNA helix visualization
 * Uses InstancedMesh for high-performance particle rendering
 */
export function generateDnaHelixRender(options: Partial<DnaHelixOptions> = {}): string {
  const opts = { ...DEFAULT_DNA_OPTIONS, ...options };
  
  return `
// DNA Helix Visualization
const dnaGroup = new THREE.Group();

// Configuration
const particlesPerStrand = ${opts.particlesPerStrand};
const helixRadius = ${opts.helixRadius};
const helixHeight = ${opts.helixHeight};
const twistCount = ${opts.twistCount};
const basePairDistance = ${opts.basePairDistance};
const particleSize = ${opts.particleSize};
const animationSpeed = ${opts.animationSpeed};

// Colors
const strandAColor = new THREE.Color("${opts.strandAColor}");
const strandBColor = new THREE.Color("${opts.strandBColor}");
const connectionColor = new THREE.Color("${opts.connectionColor}");

// Create instanced mesh for strand particles
const particleGeometry = new THREE.SphereGeometry(particleSize, 16, 16);
const particleMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.8,
  roughness: 0.2,
  emissive: 0.2,
});

// Two strands = 2 * particlesPerStrand instances
const strandMesh = new THREE.InstancedMesh(particleGeometry, particleMaterial, particlesPerStrand * 2);
strandMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

dnaGroup.add(strandMesh);

// Store initial positions for animation
const strandAPositions: THREE.Vector3[] = [];
const strandBPositions: THREE.Vector3[] = [];

// Calculate helix positions
for (let i = 0; i < particlesPerStrand; i++) {
  const t = i / (particlesPerStrand - 1);
  const angle = t * Math.PI * 2 * twistCount;
  const y = (t - 0.5) * helixHeight;
  
  // Strand A
  const xA = Math.cos(angle) * helixRadius;
  const zA = Math.sin(angle) * helixRadius;
  strandAPositions.push(new THREE.Vector3(xA, y, zA));
  
  // Strand B (180 degrees offset)
  const xB = Math.cos(angle + Math.PI) * helixRadius;
  const zB = Math.sin(angle + Math.PI) * helixRadius;
  strandBPositions.push(new THREE.Vector3(xB, y, zB));
}

// Set initial positions and colors
const dummy = new THREE.Object3D();
const color = new THREE.Color();

for (let i = 0; i < particlesPerStrand; i++) {
  // Strand A
  dummy.position.copy(strandAPositions[i]);
  dummy.updateMatrix();
  strandMesh.setMatrixAt(i, dummy.matrix);
  
  // Color gradient based on height
  const colorT = i / particlesPerStrand;
  ${getColorScaleCode(opts.colorScale, "strandAColor", "colorT")}
  strandMesh.setColorAt(i, color);
  
  // Strand B
  dummy.position.copy(strandBPositions[i]);
  dummy.updateMatrix();
  strandMesh.setMatrixAt(i + particlesPerStrand, dummy.matrix);
  
  ${getColorScaleCode(opts.colorScale, "strandBColor", "colorT")}
  strandMesh.setColorAt(i + particlesPerStrand, color);
}

strandMesh.instanceMatrix.needsUpdate = true;
if (strandMesh.instanceColor) strandMesh.instanceColor.needsUpdate = true;

${opts.showConnections ? generateConnectionLines(opts) : ""}

// Animation function
let dnaTime = 0;
function animateDnaHelix(deltaTime) {
  if (animationSpeed <= 0) return;
  
  dnaTime += deltaTime * animationSpeed;
  
  // Rotate entire helix
  dnaGroup.rotation.y = dnaTime * 0.5;
  
  // Subtle vertical oscillation
  dnaGroup.position.y = Math.sin(dnaTime * 0.8) * 0.2;
}

// Make animation function available globally
window.animateDnaHelix = animateDnaHelix;

scene.add(dnaGroup);`;
}

function getColorScaleCode(scaleType: string, baseColorVar: string, tVar: string): string {
  switch (scaleType) {
    case "rainbow":
      return `color.setHSL(${tVar}, 1.0, 0.5);`;
    case "thermal":
      return `color.setHSL(0.7 - ${tVar} * 0.7, 1.0, 0.5);`;
    case "monochrome":
      return `color.copy(${baseColorVar}).multiplyScalar(0.7 + ${tVar} * 0.6);`;
    case "gradient":
    default:
      return `color.copy(${baseColorVar});`;
  }
}

function generateConnectionLines(opts: DnaHelixOptions): string {
  return `
// Connection lines between strands
const connectionGeometry = new THREE.BufferGeometry();
const connectionPositions = new Float32Array(particlesPerStrand * 6);
const connectionColors = new Float32Array(particlesPerStrand * 6);

for (let i = 0; i < particlesPerStrand; i++) {
  const baseIdx = i * 6;
  
  // Only connect every nth particle based on basePairDistance
  if (i % Math.max(1, Math.floor(1 / ${opts.basePairDistance})) === 0) {
    // Point A
    connectionPositions[baseIdx] = strandAPositions[i].x;
    connectionPositions[baseIdx + 1] = strandAPositions[i].y;
    connectionPositions[baseIdx + 2] = strandAPositions[i].z;
    
    // Point B
    connectionPositions[baseIdx + 3] = strandBPositions[i].x;
    connectionPositions[baseIdx + 4] = strandBPositions[i].y;
    connectionPositions[baseIdx + 5] = strandBPositions[i].z;
    
    // Colors
    connectionColors[baseIdx] = connectionColor.r;
    connectionColors[baseIdx + 1] = connectionColor.g;
    connectionColors[baseIdx + 2] = connectionColor.b;
    connectionColors[baseIdx + 3] = connectionColor.r;
    connectionColors[baseIdx + 4] = connectionColor.g;
    connectionColors[baseIdx + 5] = connectionColor.b;
  }
}

connectionGeometry.setAttribute('position', new THREE.BufferAttribute(connectionPositions, 3));
connectionGeometry.setAttribute('color', new THREE.BufferAttribute(connectionColors, 3));

const connectionMaterial = new THREE.LineBasicMaterial({
  vertexColors: true,
  transparent: true,
  opacity: 0.4,
  blending: THREE.AdditiveBlending,
});

const connectionLines = new THREE.LineSegments(connectionGeometry, connectionMaterial);
dnaGroup.add(connectionLines);`;
}

/**
 * Generates a voxel representation of a mesh
 */
export interface VoxelOptions {
  voxelSize: number;
  gridSize: [number, number, number];
  hollow: boolean;
  colorSource: "normal" | "texture" | "gradient" | "height";
  gap: number;
  colorPalette: string[];
}

export function generateVoxelRender(options: Partial<VoxelOptions> = {}): string {
  const opts = {
    voxelSize: 0.2,
    gridSize: [50, 50, 50] as [number, number, number],
    hollow: false,
    colorSource: "gradient" as const,
    gap: 0.05,
    colorPalette: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"],
    ...options,
  };

  return `
// Voxel Representation
const voxelGroup = new THREE.Group();

const voxelSize = ${opts.voxelSize};
const gap = ${opts.gap};
const gridSize = [${opts.gridSize.join(", ")}];
const voxelCount = gridSize[0] * gridSize[1] * gridSize[2];

// Instanced mesh for voxels
const voxelGeometry = new THREE.BoxGeometry(voxelSize - gap, voxelSize - gap, voxelSize - gap);
const voxelMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.3,
  roughness: 0.7,
});

const voxelMesh = new THREE.InstancedMesh(voxelGeometry, voxelMaterial, voxelCount);
voxelMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

const dummy = new THREE.Object3D();
const color = new THREE.Color();
const palette = [${opts.colorPalette.map(c => `new THREE.Color("${c}")`).join(", ")}];

let instanceIndex = 0;
const bounds = new THREE.Box3().setFromObject(targetMesh);
const size = new THREE.Vector3();
bounds.getSize(size);

for (let x = 0; x < gridSize[0]; x++) {
  for (let y = 0; y < gridSize[1]; y++) {
    for (let z = 0; z < gridSize[2]; z++) {
      // Map grid position to world space
      const px = (x / gridSize[0] - 0.5) * size.x + bounds.getCenter(new THREE.Vector3()).x;
      const py = (y / gridSize[1] - 0.5) * size.y + bounds.getCenter(new THREE.Vector3()).y;
      const pz = (z / gridSize[2] - 0.5) * size.z + bounds.getCenter(new THREE.Vector3()).z;
      
      // Simple occupancy check (simplified - just places voxels in volume)
      // In a full implementation, you'd raycast or SDF check
      const distance = Math.sqrt(px * px + py * py + pz * pz);
      const maxDist = Math.max(size.x, size.y, size.z) * 0.4;
      
      if (distance < maxDist) {
        dummy.position.set(px, py, pz);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        voxelMesh.setMatrixAt(instanceIndex, dummy.matrix);
        
        // Color based on source
        ${getVoxelColorCode(opts.colorSource)}
        voxelMesh.setColorAt(instanceIndex, color);
        
        instanceIndex++;
      }
    }
  }
}

voxelMesh.count = instanceIndex;
voxelMesh.instanceMatrix.needsUpdate = true;
if (voxelMesh.instanceColor) voxelMesh.instanceColor.needsUpdate = true;

voxelGroup.add(voxelMesh);

// Hide original mesh
targetMesh.visible = false;

scene.add(voxelGroup);`;
}

function getVoxelColorCode(colorSource: string): string {
  switch (colorSource) {
    case "height":
      return `const heightT = (py + size.y * 0.5) / size.y;
        color.setHSL(0.6 - heightT * 0.6, 0.8, 0.5);`;
    case "normal":
      return `color.setRGB(
          Math.abs(px / maxDist),
          Math.abs(py / maxDist),
          Math.abs(pz / maxDist)
        );`;
    case "gradient":
      return `const gradT = (x + y + z) / (gridSize[0] + gridSize[1] + gridSize[2]);
        color.setHSL(gradT, 0.8, 0.5);`;
    default:
      return `color.copy(palette[Math.floor(Math.random() * palette.length)]);`;
  }
}

/**
 * Generates a holographic projection effect for a mesh
 */
export function generateHologramRender(): string {
  return `
// Hologram Material Setup
const hologramMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x00ffff) },
    uScanlineCount: { value: 100 },
    uFlickerIntensity: { value: 0.1 },
    uEdgeGlow: { value: 2.0 },
    uTransparency: { value: 0.8 }
  },
  vertexShader: \`
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  \`,
  fragmentShader: \`
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uScanlineCount;
    uniform float uFlickerIntensity;
    uniform float uEdgeGlow;
    uniform float uTransparency;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
      // Scanlines
      float scanline = sin(vPosition.y * uScanlineCount + uTime * 2.0) * 0.5 + 0.5;
      scanline = pow(scanline, 1.5) * 0.3 + 0.7;
      
      // Fresnel edge glow
      vec3 viewDir = normalize(-vPosition);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), uEdgeGlow);
      fresnel = clamp(fresnel, 0.0, 1.0);
      
      // Flicker effect
      float flicker = 1.0 - uFlickerIntensity * sin(uTime * 10.0 + random(vUv) * 3.14) * 0.5;
      
      // Combine effects
      vec3 finalColor = uColor * scanline * flicker;
      finalColor += uColor * fresnel * 2.0;
      
      // Alpha based on fresnel
      float alpha = fresnel * uTransparency;
      alpha = clamp(alpha, 0.0, 1.0);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  \`,
  transparent: true,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// Apply to mesh
targetMesh.traverse((child) => {
  if (child.isMesh) {
    child.material = hologramMaterial;
  }
});

// Animation update function
function updateHologramTime(time) {
  hologramMaterial.uniforms.uTime.value = time;
}

window.updateHologramTime = updateHologramTime;`;
}

/**
 * Generates a glitch/artifact effect
 */
export function generateGlitchRender(): string {
  return `
// Glitch Effect Setup
const glitchMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uIntensity: { value: 0.5 },
    uColor: { value: new THREE.Color(0xffffff) }
  },
  vertexShader: \`
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;
    varying float vGlitch;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
      vUv = uv;
      
      // Random glitch displacement
      float glitch = random(vec2(floor(uTime * 10.0), floor(position.y * 10.0)));
      vGlitch = glitch;
      
      vec3 pos = position;
      if (glitch > 0.95) {
        pos.x += (random(vec2(uTime, position.y)) - 0.5) * uIntensity;
      }
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  \`,
  fragmentShader: \`
    uniform vec3 uColor;
    uniform float uTime;
    varying vec2 vUv;
    varying float vGlitch;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
      vec3 color = uColor;
      
      // RGB split on glitch
      if (vGlitch > 0.97) {
        float r = random(vUv + vec2(0.1, 0.0));
        float g = random(vUv);
        float b = random(vUv - vec2(0.1, 0.0));
        color = vec3(r, g, b);
      }
      
      // Scanline artifacts
      float scan = step(0.98, random(vec2(0.0, vUv.y * 100.0 + uTime)));
      color *= (1.0 - scan * 0.5);
      
      gl_FragColor = vec4(color, 1.0);
    }
  \`,
  side: THREE.DoubleSide,
});

// Apply to mesh
targetMesh.traverse((child) => {
  if (child.isMesh) {
    child.material = glitchMaterial.clone();
  }
});

// Animation
function updateGlitch(time) {
  glitchMaterial.uniforms.uTime.value = time;
}

window.updateGlitch = updateGlitch;`;
}


// Additional render modes for neon wireframe

export interface NeonWireOptions {
  lineWidth: number;
  color: string;
  glowStrength: number;
  pulseSpeed: number;
  bloomIntensity: number;
  pulseOpacity: boolean;
}

export const DEFAULT_NEON_OPTIONS: NeonWireOptions = {
  lineWidth: 2,
  color: "#ff00ff",
  glowStrength: 2.0,
  pulseSpeed: 1.0,
  bloomIntensity: 1.5,
  pulseOpacity: true,
};

/**
 * Generates a neon wireframe effect with bloom
 */
export function generateNeonWireRender(options: Partial<NeonWireOptions> = {}): string {
  const opts = { ...DEFAULT_NEON_OPTIONS, ...options };
  
  return `
// Neon Wireframe Render
const neonGroup = new THREE.Group();

// Configuration
const neonColor = new THREE.Color("${opts.color}");
const lineWidth = ${opts.lineWidth};
const glowStrength = ${opts.glowStrength};
const pulseSpeed = ${opts.pulseSpeed};
const bloomIntensity = ${opts.bloomIntensity};

// Store original materials for restoration
const originalMaterials = new Map();

// Convert mesh to wireframe with neon material
targetMesh.traverse((child) => {
  if (child.isMesh) {
    // Store original
    originalMaterials.set(child.uuid, child.material);
    
    // Create wireframe geometry
    const wireframeGeo = new THREE.WireframeGeometry(child.geometry);
    
    // Neon glow material
    const neonMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: neonColor },
        uGlowStrength: { value: glowStrength },
        uPulseSpeed: { value: pulseSpeed },
        uPulseOpacity: { value: ${opts.pulseOpacity ? 1.0 : 0.0} }
      },
      vertexShader: \`
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      \`,
      fragmentShader: \`
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uGlowStrength;
        uniform float uPulseSpeed;
        uniform float uPulseOpacity;
        varying vec3 vPosition;
        
        void main() {
          // Pulse effect
          float pulse = 1.0;
          if (uPulseOpacity > 0.5) {
            pulse = 0.7 + 0.3 * sin(uTime * uPulseSpeed * 3.14159 * 2.0);
          }
          
          // Glow intensity based on distance from center (for depth)
          float depth = length(vPosition) * 0.1;
          float glow = uGlowStrength * pulse * (1.0 + depth);
          
          vec3 finalColor = uColor * glow;
          float alpha = pulse;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      \`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    
    // Create wireframe mesh
    const wireframe = new THREE.LineSegments(wireframeGeo, neonMaterial);
    wireframe.position.copy(child.position);
    wireframe.rotation.copy(child.rotation);
    wireframe.scale.copy(child.scale);
    
    // Add to neon group
    neonGroup.add(wireframe);
    
    // Hide original mesh
    child.visible = false;
  }
});

// Bloom post-processing setup
const bloomComposer = new THREE.EffectComposer(renderer);
bloomComposer.addPass(new THREE.RenderPass(scene, camera));

const bloomPass = new THREE.UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  bloomIntensity,
  0.4,
  0.7
);
bloomComposer.addPass(bloomPass);

// Animation function
function updateNeonWire(time) {
  neonGroup.traverse((child) => {
    if (child.material && child.material.uniforms) {
      child.material.uniforms.uTime.value = time;
    }
  });
}

// Add to scene
scene.add(neonGroup);

// Store references
window.neonGroup = neonGroup;
window.updateNeonWire = updateNeonWire;
window.neonBloomComposer = bloomComposer;

// Override render loop for bloom
function renderNeon() {
  bloomComposer.render();
}

window.renderNeon = renderNeon;`;
}

/**
 * Generate enhanced voxel render with animations
 */
export interface EnhancedVoxelOptions extends VoxelOptions {
  animation: "none" | "explode" | "assemble" | "pulse" | "wave";
  animationSpeed: number;
  explodeForce: number;
}

export function generateEnhancedVoxelRender(options: Partial<EnhancedVoxelOptions> = {}): string {
  const opts = {
    voxelSize: 0.2,
    gridSize: [30, 30, 30] as [number, number, number],
    hollow: false,
    colorSource: "gradient" as const,
    gap: 0.02,
    colorPalette: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"],
    animation: "none" as const,
    animationSpeed: 1.0,
    explodeForce: 2.0,
    ...options,
  };

  return `
// Enhanced Voxel Render
const voxelGroup = new THREE.Group();

const voxelSize = ${opts.voxelSize};
const gap = ${opts.gap};
const gridSize = [${opts.gridSize.join(", ")}];
const animationType = "${opts.animation}";
const animationSpeed = ${opts.animationSpeed};
const explodeForce = ${opts.explodeForce};

// Voxel geometry and material
const voxelGeometry = new THREE.BoxGeometry(voxelSize - gap, voxelSize - gap, voxelSize - gap);
const voxelMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.1,
  roughness: 0.8,
});

// Calculate voxel positions
const voxels: Array<{
  position: THREE.Vector3;
  color: THREE.Color;
  originalPos: THREE.Vector3;
  explodeDir: THREE.Vector3;
}> = [];

const palette = [${opts.colorPalette.map(c => `new THREE.Color("${c}")`).join(", ")}];
const color = new THREE.Color();

// Sphere SDF for voxel placement
const sphereRadius = Math.min(gridSize[0], gridSize[1], gridSize[2]) * voxelSize * 0.4;

for (let x = 0; x < gridSize[0]; x++) {
  for (let y = 0; y < gridSize[1]; y++) {
    for (let z = 0; z < gridSize[2]; z++) {
      const px = (x - gridSize[0] * 0.5) * voxelSize;
      const py = (y - gridSize[1] * 0.5) * voxelSize;
      const pz = (z - gridSize[2] * 0.5) * voxelSize;
      
      // Sphere SDF
      const dist = Math.sqrt(px * px + py * py + pz * pz);
      
      if (dist < sphereRadius) {
        // Color based on source
        ${getEnhancedVoxelColorCode(opts.colorSource)}
        
        const pos = new THREE.Vector3(px, py, pz);
        const explodeDir = pos.clone().normalize();
        
        voxels.push({
          position: pos.clone(),
          color: color.clone(),
          originalPos: pos.clone(),
          explodeDir,
        });
      }
    }
  }
}

// Create instanced mesh
const voxelMesh = new THREE.InstancedMesh(voxelGeometry, voxelMaterial, voxels.length);
voxelMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

const dummy = new THREE.Object3D();

// Set initial positions and colors
voxels.forEach((voxel, i) => {
  dummy.position.copy(voxel.position);
  dummy.updateMatrix();
  voxelMesh.setMatrixAt(i, dummy.matrix);
  voxelMesh.setColorAt(i, voxel.color);
});

voxelMesh.instanceMatrix.needsUpdate = true;
if (voxelMesh.instanceColor) voxelMesh.instanceColor.needsUpdate = true;

voxelGroup.add(voxelMesh);
scene.add(voxelGroup);

// Animation
let voxelTime = 0;

function animateVoxels(deltaTime) {
  voxelTime += deltaTime * animationSpeed;
  
  if (animationType === "none") return;
  
  voxels.forEach((voxel, i) => {
    let pos = voxel.originalPos.clone();
    
    switch(animationType) {
      case "explode":
        const explodeT = (Math.sin(voxelTime) + 1) * 0.5;
        pos.add(voxel.explodeDir.clone().multiplyScalar(explodeT * explodeForce));
        break;
        
      case "assemble":
        const assembleT = Math.min(voxelTime * 0.5, 1);
        const startOffset = voxel.explodeDir.clone().multiplyScalar(explodeForce * 2);
        pos.add(startOffset.multiplyScalar(1 - assembleT));
        break;
        
      case "pulse":
        const pulse = 1 + Math.sin(voxelTime * 2 + dist * 0.5) * 0.1;
        pos.multiplyScalar(pulse);
        break;
        
      case "wave":
        const waveY = Math.sin(voxelTime * 2 + voxel.originalPos.x * 0.5 + voxel.originalPos.z * 0.5) * 0.2;
        pos.y += waveY;
        break;
    }
    
    dummy.position.copy(pos);
    dummy.updateMatrix();
    voxelMesh.setMatrixAt(i, dummy.matrix);
  });
  
  voxelMesh.instanceMatrix.needsUpdate = true;
}

window.animateVoxels = animateVoxels;
window.voxelGroup = voxelGroup;`;
}

function getEnhancedVoxelColorCode(colorSource: string): string {
  switch (colorSource) {
    case "height":
      return `const heightT = (y / gridSize[1]);
        color.setHSL(0.6 - heightT * 0.6, 0.8, 0.5);`;
    case "normal":
      return `const normal = new THREE.Vector3(px, py, pz).normalize();
        color.setRGB(
          Math.abs(normal.x),
          Math.abs(normal.y),
          Math.abs(normal.z)
        );`;
    case "gradient":
      return `const gradT = (x + y + z) / (gridSize[0] + gridSize[1] + gridSize[2]);
        color.setHSL(gradT, 0.8, 0.5);`;
    case "density":
      return `const distNorm = dist / sphereRadius;
        color.setHSL(0.3 + distNorm * 0.4, 0.8, 0.5);`;
    default:
      return `color.copy(palette[Math.floor(Math.random() * palette.length)]);`;
  }
}
