import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateModel, ModelType, ModelStyle, TubeOptions } from "../models/index.js";
import { resolveTokens, ThemePreset } from "../utils/design-tokens.js";
import { generatePbrSceneSetup, pbrImports, generateAutoScale, generateResizeHandler } from "../utils/three-scene.js";
import { ColorScheme, DEFAULT_SCHEME } from "../utils/color-utils.js";
import { analyzeCodeOutput, feedbackContentBlock } from "../utils/tool-feedback.js";

export function registerSceneGenerator(server: McpServer): void {
  server.tool(
    "generate_scene",
    "Generate a composable Three.js scene with PBR lighting, a 3D model, and optional exports. Returns module JS code (not a full HTML page) that can be extended with custom elements. Exposes scene, camera, renderer, and model via window.__brushstroke.",
    {
      modelType: z.enum([
        "terrain", "abstract_sculpture", "low_poly_animal",
        "architectural", "crystal", "tree", "product",
        "tube", "torus", "helix",
      ]).describe("Type of 3D model"),
      complexity: z.number().min(0).max(1).optional()
        .describe("Model complexity 0-1"),
      style: z.enum([
        "flat", "smooth", "wireframe", "toon",
        "dna_helix", "voxel", "hologram", "neon_wire", "glitch", "particle_cloud"
      ]).optional(),
      colorScheme: z.object({
        primary: z.string().optional(),
        secondary: z.string().optional(),
        accent: z.string().optional(),
        background: z.string().optional(),
      }).optional(),
      themePreset: z.enum(["dark_premium", "light_clean", "minimal", "startup_bold", "editorial"]).optional(),
      cameraPosition: z.object({
        x: z.number(), y: z.number(), z: z.number(),
      }).optional(),
      tubeOptions: z.object({
        splinePoints: z.array(z.object({ x: z.number(), y: z.number(), z: z.number() })).optional(),
        radius: z.number().optional(),
        tubularSegments: z.number().optional(),
        radialSegments: z.number().optional(),
        closed: z.boolean().optional(),
      }).optional(),
      customElements: z.array(z.string()).optional()
        .describe("Additional Three.js code snippets to inject into the scene after model setup"),
    },
    async (params) => {
      try {
        const tokens = resolveTokens(params.themePreset as ThemePreset | undefined);
        const scheme: ColorScheme = { ...DEFAULT_SCHEME, ...params.colorScheme };
        const camPos = params.cameraPosition ?? { x: 5, y: 4, z: 6 };

        const modelCode = generateModel(
          params.modelType as ModelType,
          params.complexity ?? 0.5,
          params.colorScheme,
          (params.style as ModelStyle) ?? "smooth",
          42,
          "threejs_code",
          undefined,
          params.tubeOptions as TubeOptions | undefined,
        );

        const groupNames: Record<string, string> = {
          terrain: "terrainGroup", crystal: "crystalGroup", tree: "treeGroup",
          abstract_sculpture: "sculptureGroup", low_poly_animal: "animalGroup",
          architectural: "archGroup", product: "productGroup",
          tube: "tubeGroup", torus: "torusGroup", helix: "helixGroup",
        };
        const groupName = groupNames[params.modelType] ?? "model";

        const customCode = (params.customElements ?? []).join("\n\n");

        const code = `${pbrImports()}
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

${generatePbrSceneSetup(tokens, {
  cameraPosition: camPos,
  cameraFov: 50,
  enableShadows: true,
  appendToBody: true,
})}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

${modelCode}

const model = ${groupName};
${generateAutoScale("model")}
scene.add(model);

${customCode}

// Expose scene objects for external use
window.__brushstroke = { scene, camera, renderer, model, controls };

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

${generateResizeHandler()}`;

        const feedback = analyzeCodeOutput("generate_scene", code, "module_js");
        return {
          content: [
            { type: "text" as const, text: code },
            feedbackContentBlock(feedback),
          ],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
