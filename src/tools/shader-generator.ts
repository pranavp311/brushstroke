import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateShaderCode, ShaderType, OutputFormat } from "../shaders/index.js";

export function registerShaderGenerator(server: McpServer): void {
  server.tool(
    "generate_shader",
    "Generate WebGL/GLSL shader effects for Three.js. Ports of AcerolaFX-style effects from HLSL to GLSL.",
    {
      shaderType: z.enum([
        "ascii", "kuwahara", "halftone", "crt", "bloom",
        "dithering", "edge_detection", "pixel_sort",
      ]).describe("Type of shader effect"),
      resolution: z.tuple([z.number(), z.number()]).optional().describe("Output resolution [width, height]"),
      intensity: z.number().min(0).max(3).optional().describe("Effect intensity multiplier (0-3)"),
      outputFormat: z.enum(["three_shaderpass", "three_shadermaterial", "raw_glsl"]).optional()
        .describe("Output format"),
      // CRT options
      scanlineIntensity: z.number().min(0).max(1).optional(),
      curvature: z.number().min(1).max(20).optional(),
      vignetteStrength: z.number().min(0).max(1).optional(),
      chromaticAberration: z.number().min(0).max(0.05).optional(),
      // Bloom options
      threshold: z.number().min(0).max(1).optional(),
      blurRadius: z.number().int().min(2).max(32).optional(),
      bloomIntensity: z.number().min(0).max(5).optional(),
      // ASCII options
      charSize: z.number().min(4).max(32).optional(),
      edgeThreshold: z.number().min(0).max(1).optional(),
      colorMode: z.enum(["mono", "color"]).optional(),
      // Kuwahara options
      radius: z.number().int().min(1).max(16).optional(),
      sharpness: z.number().min(1).max(50).optional(),
      // Halftone options
      dotSize: z.number().min(2).max(20).optional(),
      spread: z.number().min(0.5).max(3).optional(),
      cmyk: z.boolean().optional(),
      // Dithering options
      ditheringMethod: z.enum(["bayer", "blue_noise"]).optional(),
      levels: z.number().min(2).max(32).optional(),
      colorize: z.boolean().optional(),
      // Edge Detection options
      edgeMethod: z.enum(["sobel", "roberts", "prewitt"]).optional(),
      lineColor: z.string().optional().describe("Hex color for edge lines"),
      backgroundColor: z.string().optional().describe("Hex color for background"),
      // Pixel Sort options
      direction: z.enum(["horizontal", "vertical"]).optional(),
      sortThreshold: z.number().min(0).max(1).optional(),
      sortRange: z.number().int().min(4).max(64).optional(),
    },
    async (params) => {
      try {
        const code = generateShaderCode(
          params.shaderType as ShaderType,
          {
            intensity: params.intensity,
            resolution: params.resolution as [number, number] | undefined,
            scanlineIntensity: params.scanlineIntensity,
            curvature: params.curvature,
            vignetteStrength: params.vignetteStrength,
            chromaticAberration: params.chromaticAberration,
            threshold: params.threshold,
            blurRadius: params.blurRadius,
            bloomIntensity: params.bloomIntensity,
            charSize: params.charSize,
            edgeThreshold: params.edgeThreshold,
            colorMode: params.colorMode,
            radius: params.radius,
            sharpness: params.sharpness,
            dotSize: params.dotSize,
            spread: params.spread,
            cmyk: params.cmyk,
            ditheringMethod: params.ditheringMethod,
            levels: params.levels,
            colorize: params.colorize,
            edgeMethod: params.edgeMethod,
            lineColor: params.lineColor,
            backgroundColor: params.backgroundColor,
            direction: params.direction,
            sortThreshold: params.sortThreshold,
            sortRange: params.sortRange,
          },
          (params.outputFormat as OutputFormat) ?? "three_shaderpass"
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
