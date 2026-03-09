import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export function floatingGeometryBackground(colors: ColorScheme, count: number, interactive: boolean): string {
  return `
import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = ${hexToThreeColor(colors.background)};

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Lighting
const ambient = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);
const pointLight = new THREE.PointLight("${colors.accent}", 2, 50);
pointLight.position.set(-5, 5, 5);
scene.add(pointLight);

// Geometries
const geometries = [
  new THREE.IcosahedronGeometry(1, 0),
  new THREE.OctahedronGeometry(1, 0),
  new THREE.TetrahedronGeometry(1, 0),
  new THREE.BoxGeometry(1.2, 1.2, 1.2),
  new THREE.TorusGeometry(0.8, 0.3, 8, 16),
];

const palette = [
  ${hexToThreeColor(colors.primary)},
  ${hexToThreeColor(colors.secondary)},
  ${hexToThreeColor(colors.accent)},
];

const meshes = [];
for (let i = 0; i < ${count}; i++) {
  const geo = geometries[Math.floor(Math.random() * geometries.length)];
  const mat = new THREE.MeshStandardMaterial({
    color: palette[Math.floor(Math.random() * palette.length)],
    metalness: 0.3,
    roughness: 0.7,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  const scale = Math.random() * 1.5 + 0.5;
  mesh.scale.setScalar(scale);
  mesh.position.set(
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 20
  );
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  mesh.userData.speed = {
    rotX: (Math.random() - 0.5) * 0.02,
    rotY: (Math.random() - 0.5) * 0.02,
    floatSpeed: Math.random() * 0.5 + 0.2,
    floatOffset: Math.random() * Math.PI * 2,
  };
  scene.add(mesh);
  meshes.push(mesh);
}

${interactive ? `
const mouse = new THREE.Vector2(0, 0);
document.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});` : ""}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  meshes.forEach((m) => {
    m.rotation.x += m.userData.speed.rotX;
    m.rotation.y += m.userData.speed.rotY;
    m.position.y += Math.sin(t * m.userData.speed.floatSpeed + m.userData.speed.floatOffset) * 0.005;
  });

  ${interactive ? `
  camera.position.x += (mouse.x * 5 - camera.position.x) * 0.03;
  camera.position.y += (mouse.y * 5 - camera.position.y) * 0.03;
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
