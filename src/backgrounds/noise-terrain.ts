import { ColorScheme, hexToThreeColor } from "../utils/color-utils.js";

export function noiseTerrainBackground(colors: ColorScheme, segments: number, interactive: boolean): string {
  return `
import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = ${hexToThreeColor(colors.background)};
scene.fog = new THREE.FogExp2("${colors.background}", 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 50);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Terrain
const geometry = new THREE.PlaneGeometry(100, 100, ${segments}, ${segments});
geometry.rotateX(-Math.PI / 2);

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: ${hexToThreeColor(colors.primary)} },
    uColor2: { value: ${hexToThreeColor(colors.secondary)} },
    uColor3: { value: ${hexToThreeColor(colors.accent)} },
  },
  vertexShader: \`
    uniform float uTime;
    varying float vHeight;
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
      vUv = uv;
      vec3 pos = position;
      float n = snoise(pos.xz * 0.05 + uTime * 0.1) * 8.0;
      n += snoise(pos.xz * 0.1 + uTime * 0.05) * 4.0;
      n += snoise(pos.xz * 0.2) * 2.0;
      pos.y += n;
      vHeight = n;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  \`,
  fragmentShader: \`
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    varying float vHeight;
    varying vec2 vUv;

    void main() {
      float t = (vHeight + 8.0) / 20.0;
      vec3 color = mix(uColor1, uColor2, smoothstep(0.0, 0.5, t));
      color = mix(color, uColor3, smoothstep(0.5, 1.0, t));
      gl_FragColor = vec4(color, 1.0);
    }
  \`,
  wireframe: true,
});

const terrain = new THREE.Mesh(geometry, material);
scene.add(terrain);

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
  material.uniforms.uTime.value = t;
  ${interactive ? `
  camera.position.x += (mouse.x * 20 - camera.position.x) * 0.02;
  camera.position.y += (30 + mouse.y * 10 - camera.position.y) * 0.02;
  camera.lookAt(0, 0, 0);` : ""}
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`;
}
