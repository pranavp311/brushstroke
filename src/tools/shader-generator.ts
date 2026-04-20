import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateShaderCode, ShaderType, OutputFormat } from "../shaders/index.js";
import { analyzeCodeOutput, feedbackContentBlock } from "../utils/tool-feedback.js";

export function registerShaderGenerator(server: McpServer): void {
  server.tool(
    "generate_shader",
    "Generate WebGL/GLSL shader effects for Three.js. Ports of AcerolaFX-style effects from HLSL to GLSL.",
    {
      shaderType: z.enum([
        "ascii", "kuwahara", "halftone", "crt", "bloom",
        "dithering", "edge_detection", "pixel_sort",
        "chromatic_aberration", "film_grain", "hologram",
      ]).describe("Type of shader effect"),
      resolution: z.object({ width: z.number(), height: z.number() }).optional().describe("Output resolution"),
      intensity: z.number().min(0).max(3).optional().describe("Effect intensity multiplier (0-3)"),
      outputFormat: z.enum(["three_shaderpass", "three_shadermaterial", "three_texture", "raw_glsl"]).optional()
        .describe("Output format — three_texture renders shader to a WebGLRenderTarget for use as texture on geometry"),
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
      // Chromatic Aberration options
      radialFalloff: z.boolean().optional().describe("Apply more aberration at screen edges"),
      // Film Grain options
      size: z.number().min(0.1).max(5).optional().describe("Grain particle size"),
      animated: z.boolean().optional().describe("Animate the grain (vs static)"),
      // Hologram options
      hologramColor: z.string().optional().describe("Hex color for hologram effect (default: #00ffff)"),
      hologramScanlines: z.number().min(10).max(300).optional().describe("Number of scanlines"),
      hologramFlicker: z.number().min(0).max(0.5).optional().describe("Flicker intensity"),
      hologramEdgeGlow: z.number().min(0.5).max(5).optional().describe("Edge glow power"),
      hologramTransparency: z.number().min(0.1).max(1).optional().describe("Overall transparency"),
    },
    async (params) => {
      try {
        const code = generateShaderCode(
          params.shaderType as ShaderType,
          {
            intensity: params.intensity,
            resolution: params.resolution ? [params.resolution.width, params.resolution.height] : undefined,
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
            radialFalloff: params.radialFalloff,
            size: params.size,
            animated: params.animated,
            hologramColor: params.hologramColor,
            hologramScanlines: params.hologramScanlines,
            hologramFlicker: params.hologramFlicker,
            hologramEdgeGlow: params.hologramEdgeGlow,
            hologramTransparency: params.hologramTransparency,
          },
          (params.outputFormat as OutputFormat) ?? "three_shaderpass"
        );

        const feedback = analyzeCodeOutput("generate_shader", code, params.outputFormat ?? "three_shaderpass");
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
