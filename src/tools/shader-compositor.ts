import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateShaderStack, generateSimpleComposite } from "../shaders/compositor.js";
import { BlendMode } from "../shaders/blend-modes/index.js";
import { ShaderType } from "../shaders/index.js";
import { analyzeCodeOutput, feedbackContentBlock } from "../utils/tool-feedback.js";

const BLEND_MODES: BlendMode[] = [
  "normal", "multiply", "screen", "overlay", "soft-light", "hard-light",
  "color-dodge", "color-burn", "difference", "exclusion", "add", "subtract"
];

const SHADER_TYPES: ShaderType[] = [
  "ascii", "kuwahara", "halftone", "crt", "bloom", "dithering",
  "edge_detection", "pixel_sort", "chromatic_aberration", "film_grain", "hologram"
];

export function registerShaderCompositor(server: McpServer): void {
  // Full shader stack tool
  server.tool(
    "generate_shader_stack",
    "Generate a composited stack of multiple shader effects with blending modes. Allows layering shaders like Photoshop layers.",
    {
      layers: z.array(z.object({
        id: z.string().describe("Unique identifier for this layer"),
        shaderType: z.enum(SHADER_TYPES as [string, ...string[]]).describe("Type of shader for this layer"),
        blendMode: z.enum(BLEND_MODES as [string, ...string[]]).default("normal").describe("How this layer blends with layers below"),
        opacity: z.number().min(0).max(1).default(1.0).describe("Layer opacity (0-1)"),
        zIndex: z.number().int().default(0).describe("Layer order (lower = behind)"),
        options: z.object({
          intensity: z.number().min(0).max(3).optional(),
          resolution: z.object({ width: z.number(), height: z.number() }).optional(),
          // CRT options
          scanlineIntensity: z.number().min(0).max(1).optional(),
          curvature: z.number().min(1).max(20).optional(),
          // Bloom options
          threshold: z.number().min(0).max(1).optional(),
          blurRadius: z.number().int().min(2).max(32).optional(),
          bloomIntensity: z.number().min(0).max(5).optional(),
          // ASCII options
          charSize: z.number().min(4).max(32).optional(),
          colorMode: z.enum(["mono", "color"]).optional(),
          // Halftone options
          dotSize: z.number().min(2).max(20).optional(),
          cmyk: z.boolean().optional(),
          // Hologram options
          hologramColor: z.string().optional(),
          hologramScanlines: z.number().min(10).max(300).optional(),
          hologramFlicker: z.number().min(0).max(0.5).optional(),
        }).optional().describe("Shader-specific options"),
      })).min(1).max(5).describe("Shader layers (max 5)"),
      resolution: z.object({ width: z.number(), height: z.number() }).default({ width: 1920, height: 1080 }).describe("Output resolution"),
      enableBloom: z.boolean().default(false).describe("Add bloom post-processing"),
      bloomStrength: z.number().min(0).max(3).default(1.5).describe("Bloom strength"),
      bloomThreshold: z.number().min(0).max(1).default(0.7).describe("Bloom threshold"),
      enableTonemapping: z.boolean().default(true).describe("Enable tone mapping"),
      exposure: z.number().min(0.1).max(3).default(1.0).describe("Exposure level"),
    },
    async (params) => {
      try {
        // Transform layer options: convert resolution objects to tuples
        const transformedLayers = params.layers.map(layer => ({
          ...layer,
          options: layer.options ? {
            ...layer.options,
            resolution: layer.options.resolution 
              ? [layer.options.resolution.width, layer.options.resolution.height] as [number, number]
              : undefined,
          } : undefined,
        }));
        const code = generateShaderStack(
          {
            layers: transformedLayers as any,
            resolution: [params.resolution.width, params.resolution.height],
          },
          {
            enableBloomPass: params.enableBloom,
            bloomStrength: params.bloomStrength,
            bloomThreshold: params.bloomThreshold,
            enableTonemapping: params.enableTonemapping,
            exposure: params.exposure,
          }
        );

        const feedback = analyzeCodeOutput("generate_shader_stack", code, "three_shaderpass");
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

  // Quick composite tool for common two-layer combinations
  server.tool(
    "generate_simple_composite",
    "Quickly composite two shaders with a blend mode. Simplified version of generate_shader_stack.",
    {
      baseShader: z.enum(SHADER_TYPES as [string, ...string[]]).describe("Base shader layer"),
      overlayShader: z.enum(SHADER_TYPES as [string, ...string[]]).describe("Overlay shader layer"),
      blendMode: z.enum(BLEND_MODES as [string, ...string[]]).default("normal").describe("Blend mode"),
      opacity: z.number().min(0).max(1).default(0.5).describe("Overlay opacity"),
      enableBloom: z.boolean().default(true).describe("Enable bloom effect"),
    },
    async (params) => {
      try {
        const code = generateSimpleComposite(
          params.baseShader as ShaderType,
          params.overlayShader as ShaderType,
          params.blendMode as BlendMode,
          params.opacity
        );

        const feedback = analyzeCodeOutput("generate_simple_composite", code, "three_shaderpass");
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
