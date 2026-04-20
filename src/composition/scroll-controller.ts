/** Generates scroll animation JS for the page composition engine */

import { DesignTokens } from "../utils/design-tokens.js";
import { generateEasingCode, EasingName } from "../animations/easings.js";

export interface ScrollKeyframe {
  rotation?: { x?: number; y?: number; z?: number };
  position?: { x?: number; y?: number; z?: number };
  cameraPosition?: { x?: number; y?: number; z?: number };
  cameraPath?: Array<{ x: number; y: number; z: number }>;
  cameraLookAt?: { x: number; y: number; z: number } | "model" | "next";
  scale?: number;
  ease?: EasingName;
}

export interface SectionScrollSpec {
  id: string;
  scrollAnimation?: ScrollKeyframe;
}

export function generateScrollController(
  sections: SectionScrollSpec[],
  _tokens: DesignTokens,
  options?: {
    mouseParallax?: boolean;
    backgroundUniformName?: string;
  }
): string {
  const mouseParallax = options?.mouseParallax ?? true;
  const bgUniform = options?.backgroundUniformName;

  // Build absolute keyframes from sections
  const keyframes = buildPageKeyframes(sections);

  // Collect camera paths from sections
  const cameraPathSections = sections
    .map((s, i) => ({ index: i, path: s.scrollAnimation?.cameraPath, lookAt: s.scrollAnimation?.cameraLookAt }))
    .filter(s => s.path && s.path.length >= 2);

  // Generate easing functions used by keyframes
  const usedEasings = new Set<EasingName>(["easeInOutCubic"]);
  keyframes.forEach(kf => {
    if (kf.ease) usedEasings.add(kf.ease);
  });

  const easingFunctions = Array.from(usedEasings).map(name => {
    const code = generateEasingCode(name);
    return `const ${name} = ${code};`;
  }).join("\n");

  // Generate camera spline code if any section uses cameraPath
  const cameraSplineCode = cameraPathSections.length > 0 ? generateCameraSplineCode(sections) : "";

  return `
// Scroll Controller
const keyframes = ${JSON.stringify(keyframes, null, 2)};

// Easing functions
${easingFunctions}

${cameraSplineCode}

function lerp(a, b, t) { return a + (b - a) * t; }

// Get easing function by name
function getEasing(name) {
  const easings = { ${Array.from(usedEasings).join(", ")} };
  return easings[name] || easeInOutCubic;
}

// Get scroll progress (0-1)
function getScrollProgress() {
  const scrollY = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  return docHeight > 0 ? Math.max(0, Math.min(1, scrollY / docHeight)) : 0;
}

${mouseParallax ? `
// Mouse parallax
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});
` : ""}

function updateScroll() {
  const progress = getScrollProgress();

  if (!model) return;

  // Find bounding keyframes
  let kfIndex = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (progress >= keyframes[i].progress) kfIndex = i;
  }
  const kfA = keyframes[kfIndex];
  const kfB = keyframes[Math.min(kfIndex + 1, keyframes.length - 1)];

  const segLen = kfB.progress - kfA.progress;
  const rawT = segLen > 0 ? Math.max(0, Math.min(1, (progress - kfA.progress) / segLen)) : 0;
  
  // Use easing from the destination keyframe (kfB), default to easeInOutCubic
  const easeFn = getEasing(kfB.ease || "easeInOutCubic");
  const localT = easeFn(rawT);

  model.rotation.x = lerp(kfA.rotation.x, kfB.rotation.x, localT);
  model.rotation.y = lerp(kfA.rotation.y, kfB.rotation.y, localT);
  model.rotation.z = lerp(kfA.rotation.z, kfB.rotation.z, localT);

  model.position.x = lerp(kfA.position.x, kfB.position.x, localT);
  model.position.y = lerp(kfA.position.y, kfB.position.y, localT);
  model.position.z = lerp(kfA.position.z, kfB.position.z, localT);

  const s = lerp(kfA.scale, kfB.scale, localT);
  model.scale.setScalar(s);

  // Camera position: use spline if available, otherwise linear interpolation
  if (typeof getCameraSplinePosition === 'function') {
    const splineResult = getCameraSplinePosition(progress, kfIndex);
    if (splineResult) {
      camera.position.copy(splineResult.position);
      ${mouseParallax ? `camera.position.x += mouseX * 0.3;
      camera.position.y += mouseY * 0.15;` : ""}
      if (splineResult.lookAt) {
        camera.lookAt(splineResult.lookAt);
      } else {
        camera.lookAt(model.position);
      }
    } else {
      camera.position.x = lerp(kfA.camera.x, kfB.camera.x, localT)${mouseParallax ? " + mouseX * 0.3" : ""};
      camera.position.y = lerp(kfA.camera.y, kfB.camera.y, localT)${mouseParallax ? " + mouseY * 0.15" : ""};
      camera.position.z = lerp(kfA.camera.z, kfB.camera.z, localT);
      camera.lookAt(model.position);
    }
  } else {
    camera.position.x = lerp(kfA.camera.x, kfB.camera.x, localT)${mouseParallax ? " + mouseX * 0.3" : ""};
    camera.position.y = lerp(kfA.camera.y, kfB.camera.y, localT)${mouseParallax ? " + mouseY * 0.15" : ""};
    camera.position.z = lerp(kfA.camera.z, kfB.camera.z, localT);
    camera.lookAt(model.position);
  }

  ${bgUniform ? `if (${bgUniform}) { ${bgUniform}.uScrollProgress.value = progress; }` : ""}
}`;
}

interface AbsoluteKeyframe {
  progress: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  scale: number;
  camera: { x: number; y: number; z: number };
  ease?: EasingName;
}

function generateCameraSplineCode(sections: SectionScrollSpec[]): string {
  const splineSections: string[] = [];

  sections.forEach((section, i) => {
    const path = section.scrollAnimation?.cameraPath;
    const lookAt = section.scrollAnimation?.cameraLookAt;
    if (!path || path.length < 2) return;

    const progressStart = i / sections.length;
    const progressEnd = (i + 1) / sections.length;
    const pointsStr = path.map(p => `new THREE.Vector3(${p.x}, ${p.y}, ${p.z})`).join(", ");

    let lookAtCode: string;
    if (lookAt === "next") {
      lookAtCode = `const lookAhead = Math.min(1, t + 0.05);
        result.lookAt = cameraSpline_${i}.getPointAt(lookAhead);`;
    } else if (lookAt === "model" || lookAt === undefined) {
      lookAtCode = `result.lookAt = null; // will default to model.position`;
    } else {
      lookAtCode = `result.lookAt = new THREE.Vector3(${lookAt.x}, ${lookAt.y}, ${lookAt.z});`;
    }

    splineSections.push(`
  // Section ${i}: camera spline
  const cameraSpline_${i} = new THREE.CatmullRomCurve3([${pointsStr}]);
  if (progress >= ${progressStart.toFixed(4)} && progress < ${progressEnd.toFixed(4)}) {
    const t = (progress - ${progressStart.toFixed(4)}) / ${(progressEnd - progressStart).toFixed(4)};
    const result = { position: cameraSpline_${i}.getPointAt(Math.max(0, Math.min(1, t))), lookAt: null };
    ${lookAtCode}
    return result;
  }`);
  });

  if (splineSections.length === 0) return "";

  return `
// Camera spline paths
function getCameraSplinePosition(progress, kfIndex) {
  ${splineSections.join("\n")}
  return null; // No spline for this section — fall back to linear interpolation
}`;
}

function buildPageKeyframes(sections: SectionScrollSpec[]): AbsoluteKeyframe[] {
  const initial: AbsoluteKeyframe = {
    progress: 0,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 },
    scale: 1,
    camera: { x: 0, y: 1.5, z: 5 },
  };

  const keyframes: AbsoluteKeyframe[] = [initial];
  let current = { ...initial };

  sections.forEach((section, i) => {
    const progress = (i + 1) / sections.length;
    const anim = section.scrollAnimation;

    const kf: AbsoluteKeyframe = {
      progress,
      rotation: {
        x: anim?.rotation?.x ?? current.rotation.x,
        y: anim?.rotation?.y ?? current.rotation.y,
        z: anim?.rotation?.z ?? current.rotation.z,
      },
      position: {
        x: anim?.position?.x ?? current.position.x,
        y: anim?.position?.y ?? current.position.y,
        z: anim?.position?.z ?? current.position.z,
      },
      scale: anim?.scale ?? current.scale,
      camera: {
        x: anim?.cameraPosition?.x ?? current.camera.x,
        y: anim?.cameraPosition?.y ?? current.camera.y,
        z: anim?.cameraPosition?.z ?? current.camera.z,
      },
      ease: anim?.ease,
    };

    keyframes.push(kf);
    current = { ...kf };
  });

  return keyframes;
}
