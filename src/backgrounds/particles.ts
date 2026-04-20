import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export function particlesBackground(colors: ColorScheme, count: number, interactive: boolean): string {
  return `
import * as THREE from 'three';

// Particles Background
const scene = new THREE.Scene();
scene.background = ${hexToThreeColor(colors.background)};
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Create particles
const count = ${count};
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
const sizes = new Float32Array(count);

const palette = [
  ${hexToThreeColor(colors.primary)},
  ${hexToThreeColor(colors.secondary)},
  ${hexToThreeColor(colors.accent)},
];

for (let i = 0; i < count; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 100;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

  const c = palette[Math.floor(Math.random() * palette.length)];
  colors[i * 3] = c.r;
  colors[i * 3 + 1] = c.g;
  colors[i * 3 + 2] = c.b;

  sizes[i] = Math.random() * 2 + 0.5;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const material = new THREE.PointsMaterial({
  size: 0.5,
  vertexColors: true,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

${interactive ? `
// Mouse interaction
const mouse = new THREE.Vector2(0, 0);
document.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});` : ""}

// Animation
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  particles.rotation.y = elapsed * 0.05;
  particles.rotation.x = elapsed * 0.02;

  // Gentle float
  const pos = geometry.attributes.position.array;
  for (let i = 0; i < count; i++) {
    pos[i * 3 + 1] += Math.sin(elapsed + i * 0.1) * 0.002;
  }
  geometry.attributes.position.needsUpdate = true;

  ${interactive ? `camera.position.x += (mouse.x * 5 - camera.position.x) * 0.05;
  camera.position.y += (mouse.y * 5 - camera.position.y) * 0.05;
  camera.lookAt(scene.position);` : ""}

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
export function particlesSceneElement(colors: ColorScheme, count: number, interactive: boolean): string {
  return `
// Particles Background (Scene Element)
const bgParticleCount = ${count};
const bgPositions = new Float32Array(bgParticleCount * 3);
const bgColors = new Float32Array(bgParticleCount * 3);
const bgSizes = new Float32Array(bgParticleCount);

const bgPalette = [
  ${hexToThreeColor(colors.primary)},
  ${hexToThreeColor(colors.secondary)},
  ${hexToThreeColor(colors.accent)},
];

for (let i = 0; i < bgParticleCount; i++) {
  bgPositions[i * 3] = (Math.random() - 0.5) * 200;
  bgPositions[i * 3 + 1] = (Math.random() - 0.5) * 200;
  bgPositions[i * 3 + 2] = (Math.random() - 0.5) * 100 - 50;

  const c = bgPalette[Math.floor(Math.random() * bgPalette.length)];
  bgColors[i * 3] = c.r;
  bgColors[i * 3 + 1] = c.g;
  bgColors[i * 3 + 2] = c.b;

  bgSizes[i] = Math.random() * 2 + 0.5;
}

const bgGeometry = new THREE.BufferGeometry();
bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
bgGeometry.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));
bgGeometry.setAttribute('size', new THREE.BufferAttribute(bgSizes, 1));

const bgMaterial = new THREE.PointsMaterial({
  size: 0.5,
  vertexColors: true,
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
  depthWrite: false,
});

const bgParticles = new THREE.Points(bgGeometry, bgMaterial);
bgParticles.position.z = -100;
scene.add(bgParticles);

${interactive ? `
// Mouse parallax for background
const bgMouse = new THREE.Vector2(0, 0);
document.addEventListener('mousemove', (e) => {
  bgMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  bgMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});` : ""}

// Background animation - will be called from main animate loop
function updateBackground(elapsed) {
  bgParticles.rotation.y = elapsed * 0.02;
  bgParticles.rotation.x = elapsed * 0.01;
  
  // Gentle float
  const pos = bgGeometry.attributes.position.array;
  for (let i = 0; i < bgParticleCount; i++) {
    pos[i * 3 + 1] += Math.sin(elapsed + i * 0.1) * 0.001;
  }
  bgGeometry.attributes.position.needsUpdate = true;
  
  ${interactive ? `
  // Subtle parallax
  bgParticles.position.x += (bgMouse.x * 2 - bgParticles.position.x) * 0.02;
  bgParticles.position.y += (bgMouse.y * 2 - bgParticles.position.y) * 0.02;` : ""}
}

// Make update function available globally for the animation loop
window.updateBackgroundParticles = updateBackground;`;
}
