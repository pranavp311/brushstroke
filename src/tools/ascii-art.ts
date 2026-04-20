import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  generateImageAsciiHtml,
  generateVideoAsciiHtml,
  generateAsciiPipelineShaderPass,
  AsciiPipelineOptions,
} from "../shaders/ascii-pipeline/index.js";
import { analyzeCodeOutput, feedbackContentBlock } from "../utils/tool-feedback.js";

const DETAIL_TO_CHAR_SIZE: Record<string, number> = {
  low: 16,
  medium: 8,
  high: 6,
  ultra: 4,
};

export function registerAsciiArt(server: McpServer): void {
  server.tool(
    "generate_ascii_art",
    "Convert an image or video into real-time ASCII art using a 4-pass GPU pipeline (AcerolaFX-inspired). Supports DoG edge detection, Sobel direction analysis, 10 luminance levels, and 5 edge characters. Default detail is ultra-fine.",
    {
      source: z.string().describe("Image URL, data URI, or video URL"),
      sourceType: z.enum(["image", "video"]).default("image")
        .describe("Source type: image for static, video for real-time"),
      detail: z.enum(["low", "medium", "high", "ultra"]).default("ultra")
        .describe("Detail level — maps to character cell size (ultra=4px, high=6px, medium=8px, low=16px)"),
      colorMode: z.enum(["mono", "color", "custom"]).default("mono")
        .describe("mono: single fg/bg colors, color: blend with original, custom: use fg/bg colors"),
      foregroundColor: z.string().default("#00FF00")
        .describe("Foreground color (hex) for mono/custom modes"),
      backgroundColor: z.string().default("#000000")
        .describe("Background color (hex)"),
      exposure: z.number().min(0.1).max(3.0).default(1.2)
        .describe("Exposure control — brightens/darkens the luminance mapping"),
      attenuation: z.number().min(0.1).max(3.0).default(1.0)
        .describe("Attenuation — gamma curve for luminance bucketing"),
      edgeSensitivity: z.number().min(0).max(2.0).default(0.5)
        .describe("Edge detection sensitivity — higher values show more edges"),
      invert: z.boolean().default(false)
        .describe("Invert character brightness"),
      colorBlend: z.number().min(0).max(1).default(0.0)
        .describe("Blend factor with original colors (only in color mode)"),
      outputFormat: z.enum(["standalone_html", "three_shaderpass"]).default("standalone_html")
        .describe("Output format"),
    },
    async (params) => {
      try {
        const opts: AsciiPipelineOptions = {
          charSize: DETAIL_TO_CHAR_SIZE[params.detail] ?? 4,
          exposure: params.exposure,
          attenuation: params.attenuation,
          edgeSensitivity: params.edgeSensitivity,
          colorMode: params.colorMode,
          foregroundColor: params.foregroundColor,
          backgroundColor: params.backgroundColor,
          invert: params.invert,
          colorBlend: params.colorBlend,
        };

        let code: string;

        if (params.outputFormat === "three_shaderpass") {
          code = generateAsciiPipelineShaderPass(opts);
        } else if (params.sourceType === "video") {
          code = generateVideoAsciiHtml(params.source, opts);
        } else {
          code = generateImageAsciiHtml(params.source, opts);
        }

        const feedback = analyzeCodeOutput("generate_ascii_art", code, params.outputFormat);
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
