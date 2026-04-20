import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateBackground, BackgroundPreset, Quality, BackgroundOutputFormat } from "../backgrounds/index.js";
import { analyzeCodeOutput, feedbackContentBlock } from "../utils/tool-feedback.js";

export function registerBackgroundGenerator(server: McpServer): void {
  server.tool(
    "generate_background",
    "Generate interactive Three.js background scenes with various presets (particles, aurora, matrix rain, etc.)",
    {
      preset: z.enum([
        "particles", "gradient_mesh", "noise_terrain", "floating_geometry",
        "wave", "starfield", "aurora", "matrix_rain", "fluid_sim",
      ]).describe("Background preset type"),
      colorScheme: z.object({
        primary: z.string().optional(),
        secondary: z.string().optional(),
        accent: z.string().optional(),
        background: z.string().optional(),
      }).optional().describe("Color scheme (hex values)"),
      quality: z.enum(["low", "medium", "high"]).optional()
        .describe("Quality tier: low=500 particles/32 segments, medium=2000/64, high=10000/128"),
      interactive: z.boolean().optional().describe("Enable mouse interaction"),
      outputFormat: z.enum(["standalone_html", "module_js", "component_react"]).optional()
        .describe("Output format"),
    },
    async (params) => {
      try {
        const code = generateBackground(
          params.preset as BackgroundPreset,
          params.colorScheme,
          (params.quality as Quality) ?? "medium",
          params.interactive ?? true,
          (params.outputFormat as BackgroundOutputFormat) ?? "standalone_html"
        );

        const feedback = analyzeCodeOutput("generate_background", code, params.outputFormat ?? "standalone_html");
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
