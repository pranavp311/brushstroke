import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export function auroraBackground(colors: ColorScheme, _segments: number, interactive: boolean): string {
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
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uColor1: { value: ${hexToThreeColor(colors.primary)} },
    uColor2: { value: ${hexToThreeColor(colors.secondary)} },
    uColor3: { value: ${hexToThreeColor(colors.accent)} },
    uBgColor: { value: ${hexToThreeColor(colors.background)} },
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
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform vec3 uBgColor;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1, 0)), f.x),
        mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = vUv;
      float t = uTime * 0.15;

      // Aurora bands
      float y = uv.y;
      float band1 = smoothstep(0.3, 0.7, y + fbm(vec2(uv.x * 3.0 + t, t * 0.5)) * 0.3);
      float band2 = smoothstep(0.4, 0.8, y + fbm(vec2(uv.x * 2.0 - t * 0.7, t * 0.3 + 5.0)) * 0.25);
      float band3 = smoothstep(0.5, 0.9, y + fbm(vec2(uv.x * 4.0 + t * 0.3, t * 0.2 + 10.0)) * 0.2);

      // Vertical curtain effect
      float curtain = fbm(vec2(uv.x * 8.0 + t * 0.5, uv.y * 2.0));
      curtain = smoothstep(0.3, 0.7, curtain);

      vec3 aurora = uColor1 * band1 * 0.6 + uColor2 * band2 * 0.4 + uColor3 * band3 * 0.3;
      aurora *= curtain * 1.5;
      aurora *= (1.0 - y) * 1.5; // Fade toward top

      ${interactive ? `
      float mouseGlow = exp(-length(uv - uMouse) * 3.0) * 0.3;
      aurora += uColor3 * mouseGlow;` : ""}

      // Stars in dark areas
      float starField = step(0.998, hash(floor(uv * 500.0)));
      float twinkle = sin(uTime * 3.0 + hash(floor(uv * 500.0)) * 100.0) * 0.5 + 0.5;
      vec3 stars = vec3(starField * twinkle);

      vec3 color = uBgColor + aurora + stars * 0.5;
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
export function auroraSceneElement(colors: ColorScheme, _segments: number, interactive: boolean): string {
  return `
// Aurora Background (Scene Element)
const auroraGeometry = new THREE.PlaneGeometry(200, 200);

const auroraMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0.0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uScrollProgress: { value: 0.0 },
    uColor1: { value: ${hexToThreeColor(colors.primary)} },
    uColor2: { value: ${hexToThreeColor(colors.secondary)} },
    uColor3: { value: ${hexToThreeColor(colors.accent)} },
    uBgColor: { value: ${hexToThreeColor(colors.background)} },
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
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform vec3 uBgColor;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1, 0)), f.x),
        mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = vUv;
      float t = uTime * 0.15;
      float scroll = uScrollProgress;

      // Aurora bands - modified by scroll
      float y = uv.y;
      float band1 = smoothstep(0.3, 0.7, y + fbm(vec2(uv.x * 3.0 + t + scroll * 0.3, t * 0.5)) * 0.3);
      float band2 = smoothstep(0.4, 0.8, y + fbm(vec2(uv.x * 2.0 - t * 0.7, t * 0.3 + 5.0 + scroll * 0.2)) * 0.25);
      float band3 = smoothstep(0.5, 0.9, y + fbm(vec2(uv.x * 4.0 + t * 0.3, t * 0.2 + 10.0)) * 0.2);

      // Vertical curtain effect
      float curtain = fbm(vec2(uv.x * 8.0 + t * 0.5, uv.y * 2.0));
      curtain = smoothstep(0.3, 0.7, curtain);

      vec3 aurora = uColor1 * band1 * 0.6 + uColor2 * band2 * 0.4 + uColor3 * band3 * 0.3;
      aurora *= curtain * 1.5;
      aurora *= (1.0 - y) * 1.5; // Fade toward top

      ${interactive ? `
      float mouseGlow = exp(-length(uv - uMouse) * 3.0) * 0.3;
      aurora += uColor3 * mouseGlow;` : ""}

      // Stars in dark areas
      float starField = step(0.998, hash(floor(uv * 500.0)));
      float twinkle = sin(uTime * 3.0 + hash(floor(uv * 500.0)) * 100.0) * 0.5 + 0.5;
      vec3 stars = vec3(starField * twinkle);

      // Subtle parallax based on scroll
      float parallax = 1.0 - scroll * 0.1;
      aurora *= parallax;

      vec3 color = uBgColor + aurora + stars * 0.5;
      gl_FragColor = vec4(color, 1.0);
    }
  \`,
  depthWrite: false,
});

const auroraMesh = new THREE.Mesh(auroraGeometry, auroraMaterial);
auroraMesh.position.z = -100;
scene.add(auroraMesh);

${interactive ? `
// Mouse interaction for aurora background
document.addEventListener('mousemove', (e) => {
  auroraMaterial.uniforms.uMouse.value.set(
    e.clientX / window.innerWidth,
    1.0 - e.clientY / window.innerHeight
  );
});` : ""}

// Update function for the main animation loop
function updateAuroraBackground(elapsed, scrollProgress) {
  auroraMaterial.uniforms.uTime.value = elapsed;
  auroraMaterial.uniforms.uScrollProgress.value = scrollProgress;
}

window.updateAuroraBackground = updateAuroraBackground;`;
}
