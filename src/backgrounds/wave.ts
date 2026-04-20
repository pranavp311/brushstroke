import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export function waveBackground(colors: ColorScheme, segments: number, interactive: boolean): string {
  return `
import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = ${hexToThreeColor(colors.background)};

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 25);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const geometry = new THREE.PlaneGeometry(60, 60, ${segments}, ${segments});
geometry.rotateX(-Math.PI / 2);

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uColor1: { value: ${hexToThreeColor(colors.primary)} },
    uColor2: { value: ${hexToThreeColor(colors.accent)} },
  },
  vertexShader: \`
    uniform float uTime;
    uniform vec2 uMouse;
    varying float vHeight;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 pos = position;
      float wave1 = sin(pos.x * 0.3 + uTime) * 2.0;
      float wave2 = sin(pos.z * 0.2 + uTime * 0.7) * 1.5;
      float wave3 = cos(pos.x * 0.15 + pos.z * 0.15 + uTime * 1.3) * 1.0;
      ${interactive ? `
      float d = length(pos.xz - uMouse * 30.0);
      float ripple = sin(d * 0.5 - uTime * 3.0) * exp(-d * 0.05) * 3.0;
      pos.y += ripple;` : ""}
      pos.y += wave1 + wave2 + wave3;
      vHeight = pos.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  \`,
  fragmentShader: \`
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    varying float vHeight;
    varying vec2 vUv;

    void main() {
      float t = (vHeight + 5.0) / 10.0;
      vec3 color = mix(uColor1, uColor2, clamp(t, 0.0, 1.0));
      gl_FragColor = vec4(color, 1.0);
    }
  \`,
  wireframe: true,
  transparent: true,
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

${interactive ? `
document.addEventListener('mousemove', (e) => {
  material.uniforms.uMouse.value.set(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
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
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`;
}

// Scene element version - for composition into existing scenes
export function waveSceneElement(colors: ColorScheme, segments: number, interactive: boolean): string {
  return `
// Wave Background (Scene Element)
const bgGeometry = new THREE.PlaneGeometry(200, 200, ${segments}, ${segments});
bgGeometry.rotateX(-Math.PI / 2);

const bgMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uScrollProgress: { value: 0.0 },
    uColor1: { value: ${hexToThreeColor(colors.primary)} },
    uColor2: { value: ${hexToThreeColor(colors.accent)} },
  },
  vertexShader: \`
    uniform float uTime;
    uniform float uScrollProgress;
    uniform vec2 uMouse;
    varying float vHeight;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 pos = position;
      float wave1 = sin(pos.x * 0.3 + uTime) * 2.0;
      float wave2 = sin(pos.z * 0.2 + uTime * 0.7) * 1.5;
      float wave3 = cos(pos.x * 0.15 + pos.z * 0.15 + uTime * 1.3) * 1.0;
      ${interactive ? `
      float d = length(pos.xz - uMouse * 30.0);
      float ripple = sin(d * 0.5 - uTime * 3.0) * exp(-d * 0.05) * 3.0;
      pos.y += ripple;` : ""}
      pos.y += wave1 + wave2 + wave3;
      vHeight = pos.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  \`,
  fragmentShader: \`
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    varying float vHeight;
    varying vec2 vUv;

    void main() {
      float t = (vHeight + 5.0) / 10.0;
      vec3 color = mix(uColor1, uColor2, clamp(t, 0.0, 1.0));
      gl_FragColor = vec4(color, 1.0);
    }
  \`,
  wireframe: true,
  transparent: true,
  depthWrite: false,
});

const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
bgMesh.position.z = -100;
scene.add(bgMesh);

${interactive ? `
// Mouse interaction for background
document.addEventListener('mousemove', (e) => {
  bgMaterial.uniforms.uMouse.value.set(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );
});` : ""}

// Update function for the main animation loop
function updateBackground(elapsed, scrollProgress) {
  bgMaterial.uniforms.uTime.value = elapsed;
  bgMaterial.uniforms.uScrollProgress.value = scrollProgress;
}

window.updateBackgroundWave = updateBackground;`;
}
