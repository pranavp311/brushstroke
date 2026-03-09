import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export function starfieldBackground(colors: ColorScheme, count: number, interactive: boolean): string {
  return `
import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = ${hexToThreeColor(colors.background)};

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const count = ${count};
const positions = new Float32Array(count * 3);
const starColors = new Float32Array(count * 3);
const starSizes = new Float32Array(count);

const palette = [
  ${hexToThreeColor(colors.primary)},
  ${hexToThreeColor(colors.secondary)},
  ${hexToThreeColor(colors.accent)},
  new THREE.Color(1, 1, 1),
];

for (let i = 0; i < count; i++) {
  // Spread in a cylinder
  const theta = Math.random() * Math.PI * 2;
  const r = Math.random() * 500;
  positions[i * 3] = Math.cos(theta) * r;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
  positions[i * 3 + 2] = Math.sin(theta) * r - 500;

  const c = palette[Math.floor(Math.random() * palette.length)];
  starColors[i * 3] = c.r;
  starColors[i * 3 + 1] = c.g;
  starColors[i * 3 + 2] = c.b;
  starSizes[i] = Math.random() * 2 + 0.3;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const material = new THREE.PointsMaterial({
  size: 1.5,
  vertexColors: true,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
});

const stars = new THREE.Points(geometry, material);
scene.add(stars);

${interactive ? `
const mouse = new THREE.Vector2(0, 0);
document.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});` : ""}

const speed = 0.5;
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Move stars toward camera (warp speed effect)
  const pos = geometry.attributes.position.array;
  for (let i = 0; i < count; i++) {
    pos[i * 3 + 2] += speed;
    if (pos[i * 3 + 2] > 1) {
      pos[i * 3 + 2] = -1000;
    }
  }
  geometry.attributes.position.needsUpdate = true;

  ${interactive ? `
  camera.rotation.x += (mouse.y * 0.1 - camera.rotation.x) * 0.05;
  camera.rotation.y += (-mouse.x * 0.1 - camera.rotation.y) * 0.05;` : ""}

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`;
}
