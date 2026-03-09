import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateModel, ModelType, ModelStyle, ModelOutputFormat } from "../models/index.js";

export function registerModelGenerator(server: McpServer): void {
  server.tool(
    "generate_3d_model",
    "Generate procedural 3D models using Three.js geometry APIs. Supports terrain, crystals, trees, sculptures, animals, and architecture.",
    {
      modelType: z.enum([
        "terrain", "abstract_sculpture", "low_poly_animal",
        "architectural", "crystal", "tree",
      ]).describe("Type of 3D model to generate"),
      complexity: z.number().min(0).max(1).optional()
        .describe("Complexity level 0-1 (affects detail, polygon count, etc.)"),
      colorScheme: z.object({
        primary: z.string().optional(),
        secondary: z.string().optional(),
        accent: z.string().optional(),
        background: z.string().optional(),
      }).optional().describe("Color scheme (hex values)"),
      style: z.enum(["flat", "smooth", "wireframe", "toon"]).optional()
        .describe("Rendering style"),
      seed: z.number().int().optional()
        .describe("Random seed for deterministic generation"),
      outputFormat: z.enum(["threejs_code", "gltf_exporter_code", "standalone_html"]).optional()
        .describe("Output format"),
    },
    async (params) => {
      try {
        const code = generateModel(
          params.modelType as ModelType,
          params.complexity ?? 0.5,
          params.colorScheme,
          (params.style as ModelStyle) ?? "flat",
          params.seed ?? 42,
          (params.outputFormat as ModelOutputFormat) ?? "threejs_code"
        );

        return {
          content: [{ type: "text" as const, text: code }],
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
