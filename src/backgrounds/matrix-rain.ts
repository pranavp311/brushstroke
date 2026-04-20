import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export function matrixRainBackground(colors: ColorScheme, _count: number, interactive: boolean): string {
  return `
import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = ${hexToThreeColor(colors.background)};

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uColor: { value: ${hexToThreeColor(colors.primary)} },
    uAccent: { value: ${hexToThreeColor(colors.accent)} },
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
    uniform vec2 uMouse;
    uniform vec3 uColor;
    uniform vec3 uAccent;
    varying vec2 vUv;

    float hash(float n) { return fract(sin(n) * 43758.5453); }

    void main() {
      vec2 fragCoord = vUv * uResolution;
      float cellSize = 14.0;
      vec2 cell = floor(fragCoord / cellSize);
      vec2 cellUv = fract(fragCoord / cellSize);

      float columns = floor(uResolution.x / cellSize);
      float columnSeed = hash(cell.x * 0.3731);

      // Rain speed per column
      float speed = 3.0 + columnSeed * 5.0;
      float offset = columnSeed * 100.0;
      float rain = mod(cell.y + uTime * speed + offset, 40.0 + columnSeed * 30.0);

      // Character simulation
      float charChange = floor(uTime * 8.0 + hash(cell.x + cell.y * columns) * 100.0);
      float charVal = hash(charChange + cell.x * 13.0 + cell.y * 7.0);

      // Build character from 5x5 grid
      vec2 charCoord = floor(cellUv * 5.0);
      float charBit = step(0.5, hash(charVal * 100.0 + charCoord.x + charCoord.y * 5.0));

      // Fade trail
      float brightness = smoothstep(20.0, 0.0, rain);
      float headGlow = smoothstep(2.0, 0.0, rain);

      vec3 color = uColor * brightness * 0.6;
      color += uAccent * headGlow;
      color *= charBit;

      ${interactive ? `
      float mouseDist = length(cell / vec2(columns, uResolution.y / cellSize) - uMouse);
      color += uAccent * exp(-mouseDist * 5.0) * 0.3 * charBit;` : ""}

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
  material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  renderer.setSize(window.innerWidth, window.innerHeight);
});`;
}

// Scene element version - for composition into existing scenes
export function matrixRainSceneElement(colors: ColorScheme, _count: number, interactive: boolean): string {
  return `
// Matrix Rain Background (Scene Element)
const bgGeometry = new THREE.PlaneGeometry(200, 200);

const bgMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uScrollProgress: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uColor: { value: ${hexToThreeColor(colors.primary)} },
    uAccent: { value: ${hexToThreeColor(colors.accent)} },
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
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    uniform vec3 uColor;
    uniform vec3 uAccent;
    varying vec2 vUv;

    float hash(float n) { return fract(sin(n) * 43758.5453); }

    void main() {
      vec2 fragCoord = vUv * uResolution;
      float cellSize = 14.0;
      vec2 cell = floor(fragCoord / cellSize);
      vec2 cellUv = fract(fragCoord / cellSize);

      float columns = floor(uResolution.x / cellSize);
      float columnSeed = hash(cell.x * 0.3731);

      // Rain speed per column
      float speed = 3.0 + columnSeed * 5.0;
      float offset = columnSeed * 100.0;
      float rain = mod(cell.y + uTime * speed + offset, 40.0 + columnSeed * 30.0);

      // Character simulation
      float charChange = floor(uTime * 8.0 + hash(cell.x + cell.y * columns) * 100.0);
      float charVal = hash(charChange + cell.x * 13.0 + cell.y * 7.0);

      // Build character from 5x5 grid
      vec2 charCoord = floor(cellUv * 5.0);
      float charBit = step(0.5, hash(charVal * 100.0 + charCoord.x + charCoord.y * 5.0));

      // Fade trail
      float brightness = smoothstep(20.0, 0.0, rain);
      float headGlow = smoothstep(2.0, 0.0, rain);

      vec3 color = uColor * brightness * 0.6;
      color += uAccent * headGlow;
      color *= charBit;

      ${interactive ? `
      float mouseDist = length(cell / vec2(columns, uResolution.y / cellSize) - uMouse);
      color += uAccent * exp(-mouseDist * 5.0) * 0.3 * charBit;` : ""}

      gl_FragColor = vec4(color, 1.0);
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

window.updateBackgroundMatrixRain = updateBackground;`;
}
