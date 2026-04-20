import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { heroComponent } from "../components/react/hero.js";
import { navigationComponent } from "../components/react/navigation.js";
import { cardComponent } from "../components/react/card.js";
import { modalComponent } from "../components/react/modal.js";
import { dataVizComponent } from "../components/react/data-viz.js";
import { vanillaHeroComponent } from "../components/vanilla/hero.js";
import { vanillaNavigationComponent } from "../components/vanilla/navigation.js";
import { vanillaCardComponent } from "../components/vanilla/card.js";
import { vanillaModalComponent } from "../components/vanilla/modal.js";
import { vanillaDataVizComponent } from "../components/vanilla/data-viz.js";
import { vanillaStatsCounter } from "../components/vanilla/stats-counter.js";
import { vanillaTestimonial } from "../components/vanilla/testimonial.js";
import { simplePricingComponent } from "../components/vanilla/pricing-table.js";
import { resolveTokens } from "../utils/design-tokens.js";
import { analyzeCodeOutput, feedbackContentBlock } from "../utils/tool-feedback.js";

type ComponentType = "hero" | "navigation" | "card" | "modal" | "data_viz" | "stats_counter" | "testimonial" | "pricing_table";

interface ComponentOptions {
  typescript: boolean;
  styling: "tailwind" | "css_modules" | "styled_components";
  darkMode: boolean;
  responsive: boolean;
  animated: boolean;
  ariaLabels: boolean;
  keyboardNav: boolean;
}

const generators: Record<ComponentType, (opts: ComponentOptions) => string> = {
  hero: heroComponent,
  navigation: navigationComponent,
  card: cardComponent,
  modal: modalComponent,
  data_viz: dataVizComponent,
  stats_counter: () => vanillaStatsCounter(resolveTokens("light_clean")),
  testimonial: () => vanillaTestimonial(resolveTokens("light_clean")),
  pricing_table: () => simplePricingComponent(resolveTokens("light_clean")),
};

const vanillaGenerators: Record<ComponentType, () => string> = {
  hero: () => vanillaHeroComponent(resolveTokens("light_clean")),
  navigation: () => vanillaNavigationComponent(resolveTokens("light_clean")),
  card: () => vanillaCardComponent(resolveTokens("light_clean")),
  modal: () => vanillaModalComponent(resolveTokens("light_clean")),
  data_viz: () => vanillaDataVizComponent(resolveTokens("light_clean")),
  stats_counter: () => vanillaStatsCounter(resolveTokens("light_clean")),
  testimonial: () => vanillaTestimonial(resolveTokens("light_clean")),
  pricing_table: () => simplePricingComponent(resolveTokens("light_clean")),
};

export function registerComponentGenerator(server: McpServer): void {
  server.tool(
    "generate_component",
    "Generate production-grade UI components. Supports React (TSX/JSX) and vanilla HTML output formats.",
    {
      componentType: z.enum(["hero", "navigation", "card", "modal", "data_viz", "stats_counter", "testimonial", "pricing_table"])
        .describe("Type of component to generate"),
      outputFormat: z.enum(["react", "vanilla_html"]).optional()
        .describe("Output format: 'react' for React/TSX components, 'vanilla_html' for self-contained HTML+CSS+JS snippets. Defaults to 'react'."),
      typescript: z.boolean().optional().describe("Generate TypeScript (TSX) instead of JSX (React only)"),
      styling: z.enum(["tailwind", "css_modules", "styled_components"]).optional()
        .describe("CSS approach (React only)"),
      darkMode: z.boolean().optional().describe("Dark mode variant"),
      responsive: z.boolean().optional().describe("Include responsive breakpoints"),
      animated: z.boolean().optional().describe("Add animations and transitions"),
      ariaLabels: z.boolean().optional().describe("Include ARIA labels for accessibility"),
      keyboardNav: z.boolean().optional().describe("Add keyboard navigation support"),
    },
    async (params) => {
      try {
        const componentType = params.componentType as ComponentType;
        const outputFormat = params.outputFormat ?? "react";

        if (outputFormat === "vanilla_html") {
          const gen = vanillaGenerators[componentType];
          if (!gen) throw new Error(`Unknown component type: ${componentType}`);
          const code = gen();
          const feedback = analyzeCodeOutput("generate_component", code, "vanilla_html");
          return {
            content: [
              { type: "text" as const, text: code },
              feedbackContentBlock(feedback),
            ],
          };
        }

        // React output
        const gen = generators[componentType];
        if (!gen) throw new Error(`Unknown component type: ${componentType}`);

        const opts: ComponentOptions = {
          typescript: params.typescript ?? true,
          styling: (params.styling as ComponentOptions["styling"]) ?? "tailwind",
          darkMode: params.darkMode ?? false,
          responsive: params.responsive ?? true,
          animated: params.animated ?? true,
          ariaLabels: params.ariaLabels ?? true,
          keyboardNav: params.keyboardNav ?? true,
        };

        const code = gen(opts);
        const feedback = analyzeCodeOutput("generate_component", code, "react");

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
