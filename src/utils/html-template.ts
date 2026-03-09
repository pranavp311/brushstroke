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
}

export function standaloneHtml(opts: HtmlTemplateOptions): string {
  const importMapBlock = opts.importMap
    ? `<script type="importmap">
${JSON.stringify({ imports: opts.importMap }, null, 2)}
</script>`
    : "";

  const scriptTags = (opts.scripts ?? [])
    .map((s) => `<script src="${s}"><\/script>`)
    .join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title ?? "Frontend MCP Output"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #000; }
    canvas { display: block; }
    ${opts.styles ?? ""}
  </style>
</head>
<body>
  ${opts.bodyContent ?? ""}
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
