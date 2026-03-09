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
