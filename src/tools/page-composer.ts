import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generatePage, PageSpec, PageSection, PageModelSource } from "../composition/page-engine.js";
import { analyzeGeneratedCode } from "../validation/static-analyzer.js";
import { StructuredFeedback, FEEDBACK_PREFIX } from "../types/tool-result.js";

const sectionSchema = z.object({
  id: z.string().describe("Unique section identifier"),
  type: z.enum(["hero_3d", "features", "specs", "showcase", "cta", "footer", "custom_html", "code_showcase"])
    .describe("Section layout type"),
  content: z.object({
    heading: z.string().optional(),
    subheading: z.string().optional(),
    body: z.string().optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
    layout: z.enum(["centered", "left", "split", "full_bleed"]).optional()
      .describe("Layout variant for this section"),
    customHtml: z.string().optional()
      .describe("Raw HTML content (for custom_html section type)"),
    codeBlock: z.string().optional()
      .describe("Code block content (for code_showcase section type)"),
    items: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      icon: z.string().optional(),
    })).optional(),
  }).describe("Section content"),
  scrollAnimation: z.object({
    rotation: z.object({ x: z.number().optional(), y: z.number().optional(), z: z.number().optional() }).optional(),
    position: z.object({ x: z.number().optional(), y: z.number().optional(), z: z.number().optional() }).optional(),
    cameraPosition: z.object({ x: z.number().optional(), y: z.number().optional(), z: z.number().optional() }).optional(),
    cameraPath: z.array(z.object({
      x: z.number(), y: z.number(), z: z.number(),
    })).optional().describe("Camera follows a CatmullRomCurve3 spline through these points"),
    cameraLookAt: z.union([
      z.object({ x: z.number(), y: z.number(), z: z.number() }),
      z.literal("model"),
      z.literal("next"),
    ]).optional().describe("Camera lookAt target: fixed point, 'model' (default), or 'next' (look ahead on spline)"),
    scale: z.number().optional(),
    ease: z.enum([
      "linear",
      "easeInQuad", "easeOutQuad", "easeInOutQuad",
      "easeInCubic", "easeOutCubic", "easeInOutCubic",
      "easeInQuart", "easeOutQuart", "easeInOutQuart",
      "easeInQuint", "easeOutQuint", "easeInOutQuint",
      "easeInSine", "easeOutSine", "easeInOutSine",
      "easeInExpo", "easeOutExpo", "easeInOutExpo",
      "easeInCirc", "easeOutCirc", "easeInOutCirc",
      "easeInBack", "easeOutBack", "easeInOutBack",
      "easeInElastic", "easeOutElastic", "easeInOutElastic",
      "easeInBounce", "easeOutBounce", "easeInOutBounce",
    ]).optional().describe("Easing function for this section's animation"),
  }).optional().describe("Scroll-triggered 3D animation for this section"),
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
        dimensions: z.object({ width: z.number(), height: z.number(), depth: z.number() }).optional(),
        features: z.record(z.boolean()).optional(),
        materialOverride: z.enum(["metallic", "matte", "glossy", "transparent"]).optional(),
      }).optional(),
      tubeOptions: z.object({
        splinePoints: z.array(z.object({ x: z.number(), y: z.number(), z: z.number() })).optional(),
        radius: z.number().optional(),
        tubularSegments: z.number().optional(),
        radialSegments: z.number().optional(),
        closed: z.boolean().optional(),
      }).optional(),
    }).optional(),
  }),
  z.object({
    type: z.literal("none"),
  }),
]);

export function registerPageComposer(server: McpServer): void {
  server.tool(
    "generate_page",
    "Generate a complete, working web page with 3D elements, scroll animations, and styled content sections. Orchestrates all 5 sub-tools into a single cohesive output with one WebGL renderer, proper PBR lighting, and design token consistency. Returns structured feedback as a __BRUSHSTROKE_FEEDBACK__ JSON block.",
    {
      title: z.string().describe("Page title"),
      themePreset: z.enum(["dark_premium", "light_clean", "minimal", "startup_bold", "editorial"]).optional()
        .describe("Theme preset for consistent styling. Defaults to 'light_clean'."),
      designTokens: z.object({
        colors: z.object({
          primary: z.string().optional(),
          secondary: z.string().optional(),
          accent: z.string().optional(),
          background: z.string().optional(),
          surface: z.string().optional(),
          text: z.string().optional(),
          textMuted: z.string().optional(),
        }).optional(),
        lighting: z.object({
          ambientIntensity: z.number().optional(),
          keyIntensity: z.number().optional(),
          envMapIntensity: z.number().optional(),
        }).optional(),
        materials: z.object({
          toneMapping: z.string().optional(),
          toneMappingExposure: z.number().optional(),
        }).optional(),
        typography: z.object({
          fontFamily: z.string().optional(),
          headingFont: z.string().optional(),
          bodyFont: z.string().optional(),
          monoFont: z.string().optional(),
          headingWeight: z.number().optional(),
          bodyWeight: z.number().optional(),
          headingLetterSpacing: z.string().optional(),
          headingSizeScale: z.number().optional(),
        }).optional(),
      }).optional().describe("Custom design tokens to override theme preset"),
      background: z.object({
        preset: z.enum([
          "particles", "gradient_mesh", "noise_terrain", "floating_geometry",
          "wave", "starfield", "aurora", "matrix_rain",
        ]),
        quality: z.enum(["low", "medium", "high"]).optional(),
        interactive: z.boolean().optional(),
      }).optional().describe("Background preset for the 3D scene"),
      postProcessing: z.object({
        bloom: z.object({
          threshold: z.number().optional(),
          strength: z.number().optional(),
          radius: z.number().optional(),
        }).optional(),
      }).optional().describe("Post-processing effects"),
      modelSource: modelSourceSchema.optional()
        .describe("3D model source: load from file, generate procedurally, or none"),
      sections: z.array(sectionSchema).min(1)
        .describe("Page content sections with optional scroll animations"),
      customElements: z.array(z.string()).optional()
        .describe("Three.js code snippets to inject into the scene after model setup"),
      sceneExports: z.boolean().optional()
        .describe("Expose scene, camera, renderer, model via window.__brushstroke"),
      heroImage: z.string().optional()
        .describe("URL for hero section background image"),
      outputFormat: z.enum(["standalone_html"]).optional()
        .describe("Output format (currently only standalone_html)"),
      preview: z.boolean().optional().default(false)
        .describe("Capture screenshots after generation for visual feedback. Adds ~5s latency."),
      previewBrief: z.string().optional()
        .describe("Design brief for VLM evaluation (only used when preview: true)"),
    },
    async (params) => {
      try {
        const spec: PageSpec = {
          title: params.title,
          themePreset: params.themePreset as PageSpec["themePreset"],
          designTokens: params.designTokens as PageSpec["designTokens"],
          background: params.background as PageSpec["background"],
          postProcessing: params.postProcessing as PageSpec["postProcessing"],
          modelSource: params.modelSource as PageModelSource | undefined,
          sections: params.sections as PageSection[],
          customElements: params.customElements,
          sceneExports: params.sceneExports,
          heroImage: params.heroImage,
          outputFormat: "standalone_html",
        };

        const { html, resolvedSpec } = generatePage(spec);
        const report = analyzeGeneratedCode(html);

        const feedback: StructuredFeedback = {
          quality: {
            overall: report.overall,
            breakdown: report.breakdown,
            pass: report.overall >= 70,
          },
          warnings: report.warnings,
          suggestions: report.suggestions,
          resolvedParams: resolvedSpec as Record<string, unknown>,
          humanReadable: formatQualityReport(report),
          metadata: {
            tool: "generate_page",
            outputFormat: "standalone_html",
          },
        };

        const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [
          { type: "text" as const, text: html },
        ];

        // Preview mode: capture screenshots
        if (params.preview) {
          try {
            const { capturePagePreviews } = await import("../utils/page-preview.js");
            const captures = await capturePagePreviews(html, {
              scrollPositions: [0, 0.5, 1.0],
              maxWidth: 720,
            });

            for (const img of captures.images) {
              content.push({
                type: "image" as const,
                data: img.base64,
                mimeType: "image/png",
              });
            }

            // Optional VLM evaluation
            if (params.previewBrief) {
              try {
                const { evaluateDesign } = await import("../utils/design-evaluation.js");
                const vlmResult = await evaluateDesign(
                  captures.images.map(i => i.base64),
                  params.previewBrief,
                  JSON.stringify(params),
                );
                // Merge VLM suggestions into feedback
                if (vlmResult.issues) {
                  for (const issue of vlmResult.issues) {
                    if (issue.suggestedFix?.paramPath) {
                      feedback.suggestions.push({
                        paramPath: issue.suggestedFix.paramPath,
                        currentValue: issue.suggestedFix.currentValue,
                        suggestedValue: issue.suggestedFix.suggestedValue,
                        reasoning: issue.suggestedFix.reasoning,
                        impact: issue.severity === "critical" ? "high" : issue.severity === "major" ? "medium" : "low",
                      });
                    }
                  }
                }
              } catch {
                // VLM evaluation is optional — don't fail the tool
              }
            }
          } catch {
            // Playwright not available — skip preview silently
          }
        }

        content.push({
          type: "text" as const,
          text: `${FEEDBACK_PREFIX}\n${JSON.stringify(feedback)}`,
        });

        return { content };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}

function formatQualityReport(report: {
  overall: number;
  breakdown: Record<string, number>;
  warnings: Array<{ message: string }>;
  suggestions: Array<{ paramPath: string; reasoning: string }>;
}): string {
  const lines: string[] = [
    "--- Quality Report ---",
    `Overall Score: ${report.overall}/100`,
    "",
    "Breakdown:",
  ];

  for (const [key, value] of Object.entries(report.breakdown)) {
    const bar = "\u2588".repeat(Math.round(value / 10)) + "\u2591".repeat(10 - Math.round(value / 10));
    lines.push(`  ${key}: ${bar} ${value}/100`);
  }

  if (report.warnings.length > 0) {
    lines.push("", "Warnings:");
    report.warnings.forEach(w => lines.push(`  \u26A0 ${w.message}`));
  }

  if (report.suggestions.length > 0) {
    lines.push("", "Suggestions:");
    report.suggestions.forEach(s => lines.push(`  \u2192 ${s.paramPath}: ${s.reasoning}`));
  }

  return lines.join("\n");
}
