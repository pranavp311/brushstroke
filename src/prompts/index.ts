/**
 * MCP Prompt Registry
 * Pre-composed workflow prompts for multi-tool patterns.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer): void {
  server.prompt(
    "create_landing_page",
    "Build a complete landing page with 3D elements, iterating until quality score >= 85",
    {
      brief: z.string().describe("Design brief describing the desired page"),
      theme: z.string().optional().describe("Theme preset name (e.g., dark_premium, startup_bold)"),
    },
    async ({ brief, theme }) => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Build a landing page for: "${brief}"
Theme: ${theme ?? "choose the best fit from: dark_premium, light_clean, minimal, startup_bold, editorial"}

Workflow:
1. Read resource brushstroke://guide/composition for tool patterns
2. Read resource brushstroke://gallery/${theme ?? "startup_bold"} for a starting template
3. Call generate_page with preview: true, previewBrief: "${brief}"
4. Parse the __BRUSHSTROKE_FEEDBACK__ JSON from the response
5. If quality.overall < 85, apply suggestions[].paramPath fixes and re-call generate_page
6. Return the final HTML when quality.overall >= 85 or after 3 iterations`,
        },
      }],
    })
  );

  server.prompt(
    "iterate_design",
    "Apply feedback fixes and regenerate a page",
    {
      currentParams: z.string().describe("JSON of current generate_page params"),
      feedback: z.string().describe("JSON of __BRUSHSTROKE_FEEDBACK__ from previous call"),
    },
    async ({ currentParams, feedback }) => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Iterate on a generated page design.

Current parameters:
${currentParams}

Previous feedback:
${feedback}

Workflow:
1. Parse the feedback JSON
2. Review quality.overall score and warnings
3. Apply each suggestion in suggestions[] by updating the matching paramPath
4. Prioritize "high" impact fixes first
5. Call generate_page with the updated params and preview: true
6. Compare the new score to the previous one
7. Return the improved HTML`,
        },
      }],
    })
  );

  server.prompt(
    "product_showcase",
    "Create a product landing page with 3D model and scroll animation",
    {
      product: z.string().describe("Product name or type"),
      brand: z.string().describe("Brand name or identity"),
    },
    async ({ product, brand }) => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Create a product showcase landing page.

Product: ${product}
Brand: ${brand}

Workflow:
1. Read resource brushstroke://reference/parameters for model types
2. Choose the best modelType for "${product}" (check product presets: smartphone, laptop, bottle, shoe, watch, headphones, tablet, mug)
3. Call generate_page with:
   - modelSource.type: "generate", modelType: "product"
   - At least 3 sections: hero_3d, features/specs, cta
   - Scroll animations with camera path for cinematic product reveal
   - preview: true
4. Parse feedback and iterate if quality.overall < 85
5. Return the final HTML`,
        },
      }],
    })
  );
}
