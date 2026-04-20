/**
 * Shared utilities for generating Three.js code that loads images/videos.
 * Used by the ASCII art tool and page composer for external media.
 */

/** Generate Three.js code to load an image as a texture */
export function generateImageLoadCode(source: string, varName: string = "imageTexture"): string {
  return `const ${varName}Loader = new THREE.TextureLoader();
const ${varName} = await new Promise((resolve, reject) => {
  ${varName}Loader.load('${source}', (tex) => {
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    resolve(tex);
  }, undefined, reject);
});`;
}

/** Generate Three.js code to create a VideoTexture */
export function generateVideoTextureCode(source: string, varName: string = "videoTexture"): string {
  return `const ${varName}El = document.createElement('video');
${varName}El.src = '${source}';
${varName}El.crossOrigin = 'anonymous';
${varName}El.loop = true;
${varName}El.muted = true;
${varName}El.playsInline = true;
${varName}El.style.display = 'none';
document.body.appendChild(${varName}El);

const ${varName} = new THREE.VideoTexture(${varName}El);
${varName}.minFilter = THREE.LinearFilter;
${varName}.magFilter = THREE.LinearFilter;

${varName}El.addEventListener('canplaythrough', () => {
  ${varName}El.play();
});`;
}

/** Generate CSS background-image code for an image URL */
export function generateCssBackgroundImage(source: string, selector: string): string {
  return `${selector} {
  background-image: url('${source}');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}`;
}
