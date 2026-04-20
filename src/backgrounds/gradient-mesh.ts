import { ColorScheme, hexToThreeColor, lighten, darken, relativeLuminance } from "../utils/color-utils.js";

function adaptiveColor4(colors: ColorScheme): string {
  const bgLum = relativeLuminance(colors.background);
  return bgLum > 0.5 ? darken(colors.background, 0.4) : lighten(colors.background, 0.3);
}

function contrastMultiplier(colors: ColorScheme): number {
  return relativeLuminance(colors.background) > 0.5 ? 1.5 : 1.0;
}

export function gradientMeshBackground(colors: ColorScheme, segments: number, interactive: boolean): string {
  const color4 = adaptiveColor4(colors);
  const contrast = contrastMultiplier(colors);

  return `
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const geometry = new THREE.PlaneGeometry(2, 2, ${segments}, ${segments});

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0.0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uContrast: { value: ${contrast.toFixed(2)} },
    uColor1: { value: ${hexToThreeColor(colors.primary)} },
    uColor2: { value: ${hexToThreeColor(colors.secondary)} },
    uColor3: { value: ${hexToThreeColor(colors.accent)} },
    uColor4: { value: ${hexToThreeColor(color4)} },
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
    uniform vec2 uMouse;
    uniform float uContrast;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform vec3 uColor4;
    varying vec2 vUv;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
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

      float n1 = snoise(uv * 2.0 + t) * uContrast;
      float n2 = snoise(uv * 3.0 - t * 0.7) * uContrast;
      float n3 = snoise(uv * 1.5 + vec2(t * 0.5, -t * 0.3)) * uContrast;

      vec3 c1 = mix(uColor1, uColor2, smoothstep(-0.5, 0.5, n1));
      vec3 c2 = mix(uColor3, uColor4, smoothstep(-0.5, 0.5, n2));
      vec3 color = mix(c1, c2, smoothstep(-0.3, 0.3, n3));

      ${interactive ? `
      float mouseDist = length(uv - uMouse);
      color = mix(uColor3, color, smoothstep(0.0, 0.4, mouseDist));` : ""}

      gl_FragColor = vec4(color, 1.0);
    }
  \`
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

${interactive ? `
document.addEventListener('mousemove', (e) => {
  material.uniforms.uMouse.value.set(
    e.clientX / window.innerWidth,
    1.0 - e.clientY / window.innerHeight
  );
});` : ""}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  material.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});`;
}

// Scene element version - for composition into existing scenes
export function gradientMeshSceneElement(colors: ColorScheme, segments: number, interactive: boolean): string {
  const color4 = adaptiveColor4(colors);
  const contrast = contrastMultiplier(colors);

  return `
// Gradient Mesh Background (Scene Element)
const bgGeometry = new THREE.PlaneGeometry(200, 200, ${segments}, ${segments});

const bgMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0.0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uScrollProgress: { value: 0.0 },
    uContrast: { value: ${contrast.toFixed(2)} },
    uColor1: { value: ${hexToThreeColor(colors.primary)} },
    uColor2: { value: ${hexToThreeColor(colors.secondary)} },
    uColor3: { value: ${hexToThreeColor(colors.accent)} },
    uColor4: { value: ${hexToThreeColor(color4)} },
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
    uniform float uScrollProgress;
    uniform vec2 uMouse;
    uniform float uContrast;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform vec3 uColor4;
    varying vec2 vUv;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
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
      float t = uTime * 0.2;
      float scroll = uScrollProgress;

      float n1 = snoise(uv * 2.0 + t + scroll * 0.5) * uContrast;
      float n2 = snoise(uv * 3.0 - t * 0.7) * uContrast;
      float n3 = snoise(uv * 1.5 + vec2(t * 0.3, -t * 0.2)) * uContrast;

      vec3 c1 = mix(uColor1, uColor2, smoothstep(-0.5, 0.5, n1));
      vec3 c2 = mix(uColor3, uColor4, smoothstep(-0.5, 0.5, n2));
      vec3 color = mix(c1, c2, smoothstep(-0.3, 0.3, n3));

      ${interactive ? `
      float mouseDist = length(uv - uMouse);
      color = mix(uColor3, color, smoothstep(0.0, 0.4, mouseDist));` : ""}

      // Fade to solid at far distance for depth
      float depth = 0.9 + 0.1 * snoise(uv * 0.5 + t * 0.1);
      gl_FragColor = vec4(color * depth, 1.0);
    }
  \`,
  depthWrite: false,
});

const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
bgMesh.position.z = -100;
scene.add(bgMesh);

${interactive ? `
// Mouse interaction for background
document.addEventListener('mousemove', (e) => {
  bgMaterial.uniforms.uMouse.value.set(
    e.clientX / window.innerWidth,
    1.0 - e.clientY / window.innerHeight
  );
});` : ""}

// Update function for the main animation loop
function updateBackground(elapsed, scrollProgress) {
  bgMaterial.uniforms.uTime.value = elapsed;
  bgMaterial.uniforms.uScrollProgress.value = scrollProgress;
}

window.updateBackgroundGradient = updateBackground;`;
}
