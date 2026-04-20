/**
 * Page Iterator Tool
 * Applies feedback fixes and regenerates, looping until target score is met.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generatePage, PageSpec } from "../composition/page-engine.js";
import { analyzeGeneratedCode } from "../validation/static-analyzer.js";
import { applyFixes } from "../utils/param-patcher.js";
import { StructuredFeedback, FEEDBACK_PREFIX } from "../types/tool-result.js";

export function registerPageIterator(server: McpServer): void {
  server.tool(
    "iterate_page",
    "Apply feedback fixes from a previous generate_page call and regenerate. Loops up to maxIterations times until targetScore is reached. Returns final HTML + all iteration feedback + before/after scores.",
    {
      currentParams: z.string().describe("JSON of current generate_page params"),
      feedback: z.string().describe("JSON of __BRUSHSTROKE_FEEDBACK__ from previous generate_page call"),
      maxIterations: z.number().min(1).max(5).optional().default(2)
        .describe("Maximum number of re-generation attempts"),
      targetScore: z.number().min(0).max(100).optional().default(85)
        .describe("Stop when quality.overall reaches this score"),
    },
    async (params) => {
      try {
        let currentParamsObj = JSON.parse(params.currentParams) as Record<string, unknown>;
        let feedbackObj = JSON.parse(params.feedback) as StructuredFeedback;
        const iterations: Array<{ iteration: number; score: number; applied: string[]; skipped: string[] }> = [];

        const initialScore = feedbackObj.quality.overall;
        let finalHtml = "";
        let finalFeedback = feedbackObj;

        for (let i = 0; i < params.maxIterations; i++) {
          // Check if we already meet the target
          if (feedbackObj.quality.overall >= params.targetScore) {
            break;
          }

          // Apply fixes from feedback
          const patchResult = applyFixes(currentParamsObj, feedbackObj.suggestions, { maxFixes: 5 });
          currentParamsObj = patchResult.params;

          iterations.push({
            iteration: i + 1,
            score: feedbackObj.quality.overall,
            applied: patchResult.applied,
            skipped: patchResult.skipped,
          });

          // If no fixes could be applied, stop
          if (patchResult.applied.length === 0) {
            break;
          }

          // Regenerate
          const spec = currentParamsObj as unknown as PageSpec;
          spec.outputFormat = "standalone_html";
          const { html, resolvedSpec } = generatePage(spec);
          const report = analyzeGeneratedCode(html);

          finalHtml = html;
          finalFeedback = {
            quality: {
              overall: report.overall,
              breakdown: report.breakdown,
              pass: report.overall >= 70,
            },
            warnings: report.warnings,
            suggestions: report.suggestions,
            resolvedParams: resolvedSpec as Record<string, unknown>,
            metadata: {
              tool: "iterate_page",
              outputFormat: "standalone_html",
            },
          };

          feedbackObj = finalFeedback;
        }

        const content: Array<{ type: "text"; text: string }> = [];

        if (finalHtml) {
          content.push({ type: "text" as const, text: finalHtml });
        }

        const summary = {
          initialScore,
          finalScore: finalFeedback.quality.overall,
          improvement: finalFeedback.quality.overall - initialScore,
          iterationsRun: iterations.length,
          targetReached: finalFeedback.quality.overall >= params.targetScore,
          iterations,
        };

        content.push({
          type: "text" as const,
          text: `--- Iteration Summary ---\n${JSON.stringify(summary, null, 2)}`,
        });

        content.push({
          type: "text" as const,
          text: `${FEEDBACK_PREFIX}\n${JSON.stringify(finalFeedback)}`,
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
