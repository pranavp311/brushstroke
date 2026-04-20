/**
 * Navier-Stokes Fluid Simulation Background
 * 
 * Real-time fluid dynamics using ping-pong buffers
 * Supports mouse interaction and auto-generated splats
 */

import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export interface FluidSimOptions {
  /** Simulation resolution (64-512, higher = more detail but slower) */
  resolution: number;
  /** Fluid viscosity (0-1, higher = thicker fluid) */
  viscosity: number;
  /** Dye diffusion rate (0-1) */
  diffusion: number;
  /** How quickly dye fades (0-1) */
  densityDissipation: number;
  /** How quickly velocity fades (0-1) */
  velocityDissipation: number;
  /** Mouse interaction radius */
  forceRadius: number;
  /** Mouse interaction strength */
  forceStrength: number;
  /** Primary color */
  colorA: string;
  /** Secondary color */
  colorB: string;
  /** Tertiary color */
  colorC: string;
  /** Auto-generated splats per second */
  splatFrequency: number;
  /** Auto-splat radius */
  splatRadius: number;
  /** Enable mouse interaction */
  mouseInteraction: boolean;
}

export const DEFAULT_FLUID_OPTIONS: FluidSimOptions = {
  resolution: 128,
  viscosity: 0.0,
  diffusion: 0.0,
  densityDissipation: 0.002,
  velocityDissipation: 0.002,
  forceRadius: 0.03,
  forceStrength: 1000,
  colorA: "#ff0044",
  colorB: "#4400ff",
  colorC: "#00ff88",
  splatFrequency: 3,
  splatRadius: 0.15,
  mouseInteraction: true,
};

/**
 * Generate Navier-Stokes fluid simulation background
 */
export function fluidSimBackground(
  colors: ColorScheme,
  options: Partial<FluidSimOptions> = {}
): string {
  const opts = {
    ...DEFAULT_FLUID_OPTIONS,
    colorA: colors.primary,
    colorB: colors.secondary,
    colorC: colors.accent,
    ...options,
  };

  return `
// Navier-Stokes Fluid Simulation
import * as THREE from 'three';

// Configuration
const simResolution = ${opts.resolution};
const dyeResolution = ${Math.floor(opts.resolution * 0.5)};
const viscosity = ${opts.viscosity};
const diffusion = ${opts.diffusion};
const densityDissipation = ${opts.densityDissipation};
const velocityDissipation = ${opts.velocityDissipation};
const forceRadius = ${opts.forceRadius};
const forceStrength = ${opts.forceStrength};
const splatFrequency = ${opts.splatFrequency};
const splatRadius = ${opts.splatRadius};
const mouseInteraction = ${opts.mouseInteraction};

// Colors
const colorA = ${hexToThreeColor(opts.colorA)};
const colorB = ${hexToThreeColor(opts.colorB)};
const colorC = ${hexToThreeColor(opts.colorC)};

// Setup renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Shader materials
const vertexShader = \`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
\`;

// Advection shader - moves quantities along velocity field
const advectionShader = {
  uniforms: {
    uVelocity: { value: null },
    uSource: { value: null },
    uTexelSize: { value: new THREE.Vector2(1/simResolution, 1/simResolution) },
    uDt: { value: 0.016 },
    uDissipation: { value: 1.0 }
  },
  vertexShader,
  fragmentShader: \`
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 uTexelSize;
    uniform float uDt;
    uniform float uDissipation;
    varying vec2 vUv;
    
    void main() {
      vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexelSize;
      gl_FragColor = uDissipation * texture2D(uSource, coord);
    }
  \`
};

// Divergence shader - calculates divergence of velocity field
const divergenceShader = {
  uniforms: {
    uVelocity: { value: null },
    uTexelSize: { value: new THREE.Vector2(1/simResolution, 1/simResolution) }
  },
  vertexShader,
  fragmentShader: \`
    uniform sampler2D uVelocity;
    uniform vec2 uTexelSize;
    varying vec2 vUv;
    
    void main() {
      float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;
      float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;
      float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;
      float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;
      float div = 0.5 * (R - L + T - B);
      gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
  \`
};

// Pressure shader - solves Poisson equation
const pressureShader = {
  uniforms: {
    uPressure: { value: null },
    uDivergence: { value: null },
    uTexelSize: { value: new THREE.Vector2(1/simResolution, 1/simResolution) }
  },
  vertexShader,
  fragmentShader: \`
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    uniform vec2 uTexelSize;
    varying vec2 vUv;
    
    void main() {
      float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
      float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
      float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
      float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
      float divergence = texture2D(uDivergence, vUv).x;
      float pressure = (L + R + T + B - divergence) * 0.25;
      gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
  \`
};

// Gradient subtract shader - subtracts pressure gradient from velocity
const gradientSubtractShader = {
  uniforms: {
    uPressure: { value: null },
    uVelocity: { value: null },
    uTexelSize: { value: new THREE.Vector2(1/simResolution, 1/simResolution) }
  },
  vertexShader,
  fragmentShader: \`
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    uniform vec2 uTexelSize;
    varying vec2 vUv;
    
    void main() {
      float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
      float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
      float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
      float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
      vec2 velocity = texture2D(uVelocity, vUv).xy;
      velocity.xy -= vec2(R - L, T - B) * 0.5;
      gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
  \`
};

// Display shader - renders dye to screen
const displayShader = {
  uniforms: {
    uTexture: { value: null },
    uColorA: { value: colorA },
    uColorB: { value: colorB },
    uColorC: { value: colorC }
  },
  vertexShader,
  fragmentShader: \`
    uniform sampler2D uTexture;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    varying vec2 vUv;
    
    void main() {
      vec3 dye = texture2D(uTexture, vUv).xyz;
      
      // Mix colors based on dye channels
      vec3 color = uColorA * dye.r + uColorB * dye.g + uColorC * dye.b;
      float intensity = length(dye);
      
      // Add glow
      color += uColorA * intensity * 0.5;
      
      gl_FragColor = vec4(color, 1.0);
    }
  \`
};

// Setup render targets (ping-pong buffers)
function createDoubleFBO(width, height, type) {
  const fbo1 = new THREE.WebGLRenderTarget(width, height, {
    type,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  });
  const fbo2 = new THREE.WebGLRenderTarget(width, height, {
    type,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  });
  return { read: fbo1, write: fbo2, swap: () => { const temp = fbo1; fbo1 = fbo2; fbo2 = temp; } };
}

// Create FBOs
const velocityFBO = createDoubleFBO(simResolution, simResolution, THREE.HalfFloatType);
const pressureFBO = createDoubleFBO(simResolution, simResolution, THREE.HalfFloatType);
const divergenceFBO = new THREE.WebGLRenderTarget(simResolution, simResolution, {
  type: THREE.HalfFloatType,
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
});
const dyeFBO = createDoubleFBO(dyeResolution, dyeResolution, THREE.HalfFloatType);

// Camera and scene for FBO rendering
const fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const fboScene = new THREE.Scene();
const fboMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
fboScene.add(fboMesh);

// Mouse tracking
const mouse = { x: 0, y: 0, prevX: 0, prevY: 0, down: false };

if (mouseInteraction) {
  document.addEventListener('mousemove', (e) => {
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = 1.0 - e.clientY / window.innerHeight;
  });
  document.addEventListener('mousedown', () => mouse.down = true);
  document.addEventListener('mouseup', () => mouse.down = false);
}

// Splat function - adds dye and velocity
function splat(x, y, dx, dy, color) {
  const splatMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTarget: { value: null },
      uPoint: { value: new THREE.Vector2(x, y) },
      uColor: { value: new THREE.Vector3(color.r, color.g, color.b) },
      uRadius: { value: splatRadius }
    },
    vertexShader,
    fragmentShader: \`
      uniform sampler2D uTarget;
      uniform vec2 uPoint;
      uniform vec3 uColor;
      uniform float uRadius;
      varying vec2 vUv;
      
      void main() {
        vec2 p = vUv - uPoint;
        p.x *= ${opts.resolution}.0 / ${opts.resolution}.0; // Aspect ratio fix
        float splat = exp(-dot(p, p) / uRadius);
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + uColor * splat, 1.0);
      }
    \`
  });
  
  fboMesh.material = splatMaterial;
  
  // Splat velocity
  splatMaterial.uniforms.uTarget.value = velocityFBO.read.texture;
  splatMaterial.uniforms.uColor.value.set(dx * forceStrength, dy * forceStrength, 0);
  renderer.setRenderTarget(velocityFBO.write);
  renderer.render(fboScene, fboCamera);
  velocityFBO.swap();
  
  // Splat dye
  splatMaterial.uniforms.uTarget.value = dyeFBO.read.texture;
  splatMaterial.uniforms.uColor.value.set(color.r, color.g, color.b);
  renderer.setRenderTarget(dyeFBO.write);
  renderer.render(fboScene, fboCamera);
  dyeFBO.swap();
}

// Simulation step
function step(dt) {
  // Initialize materials once
  if (!materialCache.has('advection')) {
    materialCache.set('advection', new THREE.ShaderMaterial(advectionShader));
    materialCache.set('divergence', new THREE.ShaderMaterial(divergenceShader));
    materialCache.set('pressure', new THREE.ShaderMaterial(pressureShader));
    materialCache.set('gradientSubtract', new THREE.ShaderMaterial(gradientSubtractShader));
  }
  
  const advectionMat = materialCache.get('advection');
  const divergenceMat = materialCache.get('divergence');
  const pressureMat = materialCache.get('pressure');
  const gradientSubtractMat = materialCache.get('gradientSubtract');
  
  // Advect velocity
  fboMesh.material = advectionMat;
  advectionMat.uniforms.uVelocity.value = velocityFBO.read.texture;
  advectionMat.uniforms.uSource.value = velocityFBO.read.texture;
  advectionMat.uniforms.uDissipation.value = velocityDissipation;
  renderer.setRenderTarget(velocityFBO.write);
  renderer.render(fboScene, fboCamera);
  velocityFBO.swap();
  
  // Calculate divergence
  fboMesh.material = divergenceMat;
  divergenceMat.uniforms.uVelocity.value = velocityFBO.read.texture;
  renderer.setRenderTarget(divergenceFBO);
  renderer.render(fboScene, fboCamera);
  
  // Solve pressure (multiple iterations)
  fboMesh.material = pressureMat;
  for (let i = 0; i < 20; i++) {
    pressureMat.uniforms.uPressure.value = pressureFBO.read.texture;
    pressureMat.uniforms.uDivergence.value = divergenceFBO.texture;
    renderer.setRenderTarget(pressureFBO.write);
    renderer.render(fboScene, fboCamera);
    pressureFBO.swap();
  }
  
  // Subtract gradient
  fboMesh.material = gradientSubtractMat;
  gradientSubtractMat.uniforms.uPressure.value = pressureFBO.read.texture;
  gradientSubtractMat.uniforms.uVelocity.value = velocityFBO.read.texture;
  renderer.setRenderTarget(velocityFBO.write);
  renderer.render(fboScene, fboCamera);
  velocityFBO.swap();
  
  // Advect dye
  advectionMat.uniforms.uVelocity.value = velocityFBO.read.texture;
  advectionMat.uniforms.uSource.value = dyeFBO.read.texture;
  advectionMat.uniforms.uDissipation.value = densityDissipation;
  renderer.setRenderTarget(dyeFBO.write);
  renderer.render(fboScene, fboCamera);
  dyeFBO.swap();
}

// Auto splat timer
let autoSplatTimer = 0;
let lastTime = performance.now();

// Animation loop
function animateFluid() {
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  
  // Mouse interaction
  if (mouseInteraction && mouse.down) {
    const dx = mouse.x - mouse.prevX;
    const dy = mouse.y - mouse.prevY;
    if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
      const color = new THREE.Vector3(
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5
      );
      splat(mouse.x, mouse.y, dx * 10, dy * 10, color);
    }
  }
  
  // Auto splats
  autoSplatTimer += dt;
  if (autoSplatTimer > 1.0 / splatFrequency) {
    autoSplatTimer = 0;
    const x = Math.random();
    const y = Math.random();
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.5 + 0.5;
    const color = new THREE.Vector3(
      Math.random() > 0.5 ? 1 : 0,
      Math.random() > 0.5 ? 1 : 0,
      Math.random() > 0.5 ? 1 : 0
    );
    splat(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color);
  }
  
  // Step simulation
  step(dt);
  
  // Render to screen
  fboMesh.material = new THREE.ShaderMaterial(displayShader);
  displayShader.uniforms.uTexture.value = dyeFBO.read.texture;
  renderer.setRenderTarget(null);
  renderer.render(fboScene, fboCamera);
  
  requestAnimationFrame(animateFluid);
}

// Start animation
animateFluid();

// Handle resize
window.addEventListener('resize', () => {
  // FBOs are automatically resized by Three.js
});
`;
}

/**
 * Scene element version for composition
 */
export function fluidSimSceneElement(
  colors: ColorScheme,
  options: Partial<FluidSimOptions> = {}
): string {
  // Similar to above but returns mesh setup code instead of standalone
  // This allows integration into existing scenes
  return `
// Fluid Simulation Scene Element
// Note: Full fluid sim requires custom render target setup
// This is a simplified version for scene composition

const fluidGeometry = new THREE.PlaneGeometry(100, 100);
const fluidMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(128, 128) },
    uColorA: { value: ${hexToThreeColor(colors.primary)} },
    uColorB: { value: ${hexToThreeColor(colors.secondary)} },
    uColorC: { value: ${hexToThreeColor(colors.accent)} }
  },
  vertexShader: \`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  \`,
  fragmentShader: \`
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    varying vec2 vUv;
    
    // Simplex noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      vec2 uv = vUv;
      float t = uTime * 0.3;
      
      // Layered noise for fluid-like motion
      float n1 = snoise(uv * 3.0 + t);
      float n2 = snoise(uv * 5.0 - t * 0.5);
      float n3 = snoise(uv * 8.0 + t * 0.3);
      
      float fluid = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
      
      // Mix colors
      vec3 color = mix(uColorA, uColorB, fluid * 0.5 + 0.5);
      color = mix(color, uColorC, n3 * 0.3 + 0.3);
      
      // Add glow
      color += uColorA * max(0.0, fluid) * 0.3;
      
      gl_FragColor = vec4(color, 0.8);
    }
  \`,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide
});

const fluidMesh = new THREE.Mesh(fluidGeometry, fluidMaterial);
fluidMesh.position.z = -50;
scene.add(fluidMesh);

// Update function
function updateFluidBackground(time) {
  fluidMaterial.uniforms.uTime.value = time;
}

window.updateFluidBackground = updateFluidBackground;
`;
}
