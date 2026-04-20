/** Central HTML template with CDN URLs for standalone outputs */

const CDN = {
  three: "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
  threeAddons: "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/",
  gsap: "https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js",
  gsapScrollTrigger: "https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/ScrollTrigger.min.js",
  react: "https://cdn.jsdelivr.net/npm/react@19/umd/react.production.min.js",
  reactDom: "https://cdn.jsdelivr.net/npm/react-dom@19/umd/react-dom.production.min.js",
} as const;

export { CDN };

export interface HtmlTemplateOptions {
  title?: string;
  styles?: string;
  bodyContent?: string;
  scripts?: string[];
  moduleScript?: string;
  importMap?: Record<string, string>;
  backgroundColor?: string;
  skipLink?: boolean;
  mainId?: string;
}

// Base accessibility styles (skip link, reduced motion, focus visible)
const accessibilityStyles = `
/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px 16px;
  text-decoration: none;
  z-index: 10000;
  transition: top 0.3s;
  font-family: system-ui, sans-serif;
  font-size: 14px;
}
.skip-link:focus {
  top: 0;
}

/* Focus visible styles */
:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .reveal {
    opacity: 1 !important;
    transform: none !important;
  }
}
`;

export function standaloneHtml(opts: HtmlTemplateOptions): string {
  const importMapBlock = opts.importMap
    ? `<script type="importmap">
${JSON.stringify({ imports: opts.importMap }, null, 2)}
</script>`
    : "";

  const scriptTags = (opts.scripts ?? [])
    .map((s) => `<script src="${s}"><\/script>`)
    .join("\n    ");

  const bgColor = opts.backgroundColor ?? "#F5F0EB";
  const mainId = opts.mainId ?? "main-content";
  
  // Skip link HTML
  const skipLinkHtml = opts.skipLink !== false ? `
  <a href="#${mainId}" class="skip-link">Skip to main content</a>
` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title ?? "Brushstroke Output"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: ${bgColor}; }
    canvas { display: block; }
    ${accessibilityStyles}
    ${opts.styles ?? ""}
  </style>
</head>
<body>
  ${skipLinkHtml}
  <main id="${mainId}">
    ${opts.bodyContent ?? ""}
  </main>
  ${importMapBlock}
  ${scriptTags}
  ${opts.moduleScript ? `<script type="module">\n${opts.moduleScript}\n<\/script>` : ""}
</body>
</html>`;
}

export function threeImportMap(): Record<string, string> {
  return {
    three: CDN.three,
    "three/addons/": CDN.threeAddons,
  };
}
