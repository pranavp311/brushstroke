import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { heroComponent } from "../components/react/hero.js";
import { navigationComponent } from "../components/react/navigation.js";
import { cardComponent } from "../components/react/card.js";
import { modalComponent } from "../components/react/modal.js";
import { dataVizComponent } from "../components/react/data-viz.js";

type ComponentType = "hero" | "navigation" | "card" | "modal" | "data_viz";

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
};

export function registerComponentGenerator(server: McpServer): void {
  server.tool(
    "generate_component",
    "Generate production-grade React components with configurable styling, accessibility, and animation options.",
    {
      componentType: z.enum(["hero", "navigation", "card", "modal", "data_viz"])
        .describe("Type of component to generate"),
      typescript: z.boolean().optional().describe("Generate TypeScript (TSX) instead of JSX"),
      styling: z.enum(["tailwind", "css_modules", "styled_components"]).optional()
        .describe("CSS approach"),
      darkMode: z.boolean().optional().describe("Dark mode variant"),
      responsive: z.boolean().optional().describe("Include responsive breakpoints"),
      animated: z.boolean().optional().describe("Add animations and transitions"),
      ariaLabels: z.boolean().optional().describe("Include ARIA labels for accessibility"),
      keyboardNav: z.boolean().optional().describe("Add keyboard navigation support"),
    },
    async (params) => {
      try {
        const componentType = params.componentType as ComponentType;
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
