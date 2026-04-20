/**
 * Design Evaluator Tool
 *
 * Sends page screenshots + user brief to a VLM and returns structured
 * design evaluation with actionable parameter suggestions.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { evaluateDesign } from "../utils/design-evaluation.js";

export function registerDesignEvaluator(server: McpServer): void {
  server.tool(
    "evaluate_design",
    "Evaluate the visual design quality of page screenshots against a user's creative brief using a Vision Language Model. Returns scored evaluation with specific parameter-level fix suggestions.",
    {
      screenshots: z.array(z.string()).min(1)
        .describe("Base64 PNG screenshots of the page at different scroll positions"),
      designBrief: z.string()
        .describe("The user's original design intent / creative brief"),
      currentParams: z.string().optional()
        .describe("JSON string of the current generate_page parameters"),
      previousScore: z.number().optional()
        .describe("Score from the previous iteration for comparison"),
      iterationNumber: z.number().optional().default(1)
        .describe("Current iteration number in the refinement loop"),
      vlmProvider: z.enum(["ollama", "together", "fireworks", "openai"]).optional().default("ollama")
        .describe("VLM provider to use"),
      vlmModel: z.string().optional().default("qwen2.5-vl:7b")
        .describe("VLM model name"),
      vlmApiKey: z.string().optional()
        .describe("API key for cloud VLM providers"),
    },
    async (params) => {
      try {
        const evaluation = await evaluateDesign(
          params.screenshots,
          params.designBrief,
          params.currentParams,
          {
            vlmProvider: params.vlmProvider,
            vlmModel: params.vlmModel,
            vlmApiKey: params.vlmApiKey,
            previousScore: params.previousScore,
            iterationNumber: params.iterationNumber,
          }
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(evaluation, null, 2),
            },
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
