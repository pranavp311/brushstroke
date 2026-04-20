import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateScrollAnimation, ScrollSection, ModelSource, AnimationOutputFormat } from "../animations/scroll-templates.js";
import { analyzeCodeOutput, feedbackContentBlock } from "../utils/tool-feedback.js";

const sectionSchema = z.object({
  id: z.string(),
  duration: z.number().min(0.5).max(20),
  animation: z.object({
    target: z.string().optional(),
    rotation: z.object({
      x: z.number().optional(),
      y: z.number().optional(),
      z: z.number().optional(),
    }).optional(),
    position: z.object({
      x: z.number().optional(),
      y: z.number().optional(),
      z: z.number().optional(),
    }).optional(),
    scale: z.number().optional(),
    cameraPosition: z.object({
      x: z.number().optional(),
      y: z.number().optional(),
      z: z.number().optional(),
    }).optional(),
    cameraPath: z.array(z.object({
      x: z.number(), y: z.number(), z: z.number(),
    })).optional().describe("Camera follows a CatmullRomCurve3 spline through these points"),
    cameraLookAt: z.union([
      z.object({ x: z.number(), y: z.number(), z: z.number() }),
      z.literal("model"),
      z.literal("next"),
    ]).optional().describe("Camera lookAt target: fixed point, 'model' (default), or 'next' (look ahead on spline)"),
    ease: z.string().optional(),
  }),
});

const modelSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("file"),
    path: z.string(),
  }),
  z.object({
    type: z.literal("generate"),
    modelType: z.enum(["terrain", "abstract_sculpture", "low_poly_animal", "architectural", "crystal", "tree", "product", "tube", "torus", "helix"]),
    modelOptions: z.object({
      complexity: z.number().optional(),
      style: z.string().optional(),
      seed: z.number().optional(),
      productOptions: z.object({
        preset: z.enum(["smartphone", "laptop", "bottle", "shoe", "watch", "headphones", "tablet", "mug"]),
        dimensions: z.object({
          width: z.number().optional(),
          height: z.number().optional(),
          depth: z.number().optional(),
        }).optional(),
        features: z.record(z.boolean()).optional(),
        materialOverride: z.enum(["metallic", "matte", "glossy", "transparent"]).optional(),
      }).optional(),
    }).optional(),
  }),
  z.object({
    type: z.literal("none"),
  }),
]);

export function registerScrollAnimation(server: McpServer): void {
  server.tool(
    "generate_scroll_animation",
    "Generate scroll-based Three.js animations with configurable sections. Supports loading models, generating procedural models, or using a default scene.",
    {
      modelSource: modelSourceSchema.optional()
        .describe("Model to animate: load from file, generate procedurally, or use default"),
      sections: z.array(sectionSchema).min(1)
        .describe("Array of scroll sections with animation keyframes"),
      colorScheme: z.object({
        primary: z.string().optional(),
        secondary: z.string().optional(),
        accent: z.string().optional(),
        background: z.string().optional(),
      }).optional(),
      outputFormat: z.enum(["standalone_html", "module_js"]).optional(),
    },
    async (params) => {
      try {
        const code = generateScrollAnimation(
          (params.modelSource as ModelSource) ?? { type: "none" },
          params.sections as ScrollSection[],
          params.colorScheme,
          (params.outputFormat as AnimationOutputFormat) ?? "standalone_html"
        );

        const feedback = analyzeCodeOutput("generate_scroll_animation", code, params.outputFormat ?? "standalone_html");
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
