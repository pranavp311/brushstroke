import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateModel, ModelType, ModelStyle, ModelOutputFormat } from "../models/index.js";
import { analyzeCodeOutput, feedbackContentBlock } from "../utils/tool-feedback.js";

export function registerModelGenerator(server: McpServer): void {
  server.tool(
    "generate_3d_model",
    "Generate procedural 3D models using Three.js geometry APIs. Supports terrain, crystals, trees, sculptures, animals, architecture, and product models.",
    {
      modelType: z.enum([
        "terrain", "abstract_sculpture", "low_poly_animal",
        "architectural", "crystal", "tree", "product",
        "tube", "torus", "helix",
      ]).describe("Type of 3D model to generate"),
      complexity: z.number().min(0).max(1).optional()
        .describe("Complexity level 0-1 (affects detail, polygon count, etc.)"),
      colorScheme: z.object({
        primary: z.string().optional(),
        secondary: z.string().optional(),
        accent: z.string().optional(),
        background: z.string().optional(),
      }).optional().describe("Color scheme (hex values)"),
      style: z.enum([
        "flat", "smooth", "wireframe", "toon",
        "dna_helix", "voxel", "hologram", "neon_wire", "glitch", "particle_cloud"
      ]).optional()
        .describe("Rendering style (includes advanced modes like dna_helix, voxel, hologram, neon_wire, glitch, particle_cloud)"),
      seed: z.number().int().optional()
        .describe("Random seed for deterministic generation"),
      outputFormat: z.enum(["threejs_code", "gltf_exporter_code", "standalone_html"]).optional()
        .describe("Output format"),
      tubeOptions: z.object({
        splinePoints: z.array(z.object({ x: z.number(), y: z.number(), z: z.number() })).optional()
          .describe("Control points for the spline curve"),
        radius: z.number().min(0.01).max(5).optional().describe("Tube radius"),
        tubularSegments: z.number().int().min(8).max(512).optional(),
        radialSegments: z.number().int().min(3).max(64).optional(),
        closed: z.boolean().optional().describe("Close the tube into a loop"),
      }).optional().describe("Options for tube/helix model types"),
      productOptions: z.object({
        preset: z.enum(["smartphone", "laptop", "bottle", "shoe", "watch", "headphones", "tablet", "mug"])
          .describe("Product preset to generate"),
        dimensions: z.object({
          width: z.number().optional(),
          height: z.number().optional(),
          depth: z.number().optional(),
        }).optional().describe("Custom dimensions"),
        features: z.record(z.boolean()).optional()
          .describe("Toggle features (e.g. { camera: false, buttons: true })"),
        materialOverride: z.enum(["metallic", "matte", "glossy", "transparent"]).optional()
          .describe("Material style override"),
      }).optional().describe("Options for product model type (required when modelType is 'product')"),
    },
    async (params) => {
      try {
        const code = generateModel(
          params.modelType as ModelType,
          params.complexity ?? 0.5,
          params.colorScheme,
          (params.style as ModelStyle) ?? "flat",
          params.seed ?? 42,
          (params.outputFormat as ModelOutputFormat) ?? "threejs_code",
          params.productOptions,
          params.tubeOptions
        );

        const feedback = analyzeCodeOutput("generate_3d_model", code, params.outputFormat ?? "threejs_code");
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
