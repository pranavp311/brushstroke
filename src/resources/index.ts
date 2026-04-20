/**
 * MCP Resource Registry
 * Exposes browsable documentation, theme presets, and example galleries.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { COMPOSITION_GUIDE } from "./guides/composition.js";
import { ITERATION_GUIDE } from "./guides/iteration.js";
import { PARAMETER_SPACE_DOCS } from "./content/parameter-space.js";
import { GALLERIES } from "./galleries/index.js";
import { THEME_PRESETS } from "../utils/design-tokens.js";

export function registerResources(server: McpServer): void {
  // Tool composition guide
  server.resource(
    "tool-composition-guide",
    "brushstroke://guide/composition",
    {
      description: "How to combine brushstroke tools for common workflows",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: COMPOSITION_GUIDE,
        mimeType: "text/markdown",
      }],
    })
  );

  // Iteration workflow guide
  server.resource(
    "iteration-guide",
    "brushstroke://guide/iteration",
    {
      description: "The generate -> evaluate -> fix iteration loop",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: ITERATION_GUIDE,
        mimeType: "text/markdown",
      }],
    })
  );

  // Parameter space reference
  server.resource(
    "parameter-reference",
    "brushstroke://reference/parameters",
    {
      description: "Full parameter space documentation for all tools",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: PARAMETER_SPACE_DOCS,
        mimeType: "text/markdown",
      }],
    })
  );

  // Theme presets with full token values
  server.resource(
    "theme-presets",
    "brushstroke://reference/themes",
    {
      description: "All theme presets with complete design token values",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: JSON.stringify(THEME_PRESETS, null, 2),
        mimeType: "application/json",
      }],
    })
  );

  // Background presets
  server.resource(
    "background-presets",
    "brushstroke://reference/backgrounds",
    {
      description: "Available background presets with descriptions",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: JSON.stringify({
          particles: { description: "Floating particle field with depth-of-field", quality_levels: ["low", "medium", "high"], interactive: true },
          gradient_mesh: { description: "Animated multi-color gradient mesh", quality_levels: ["low", "medium", "high"], interactive: true },
          noise_terrain: { description: "Procedural terrain visualization", quality_levels: ["low", "medium", "high"], interactive: true },
          floating_geometry: { description: "Floating geometric shapes", quality_levels: ["low", "medium", "high"], interactive: true },
          wave: { description: "Undulating wave surface", quality_levels: ["low", "medium", "high"], interactive: true },
          starfield: { description: "Star field with parallax depth", quality_levels: ["low", "medium", "high"], interactive: true },
          aurora: { description: "Northern lights effect", quality_levels: ["low", "medium", "high"], interactive: false },
          matrix_rain: { description: "Matrix-style character rain", quality_levels: ["low", "medium", "high"], interactive: false },
          fluid_sim: { description: "GPU-based fluid simulation", quality_levels: ["low", "medium", "high"], interactive: true },
        }, null, 2),
        mimeType: "application/json",
      }],
    })
  );

  // Section types
  server.resource(
    "section-types",
    "brushstroke://reference/sections",
    {
      description: "Section types with layout options and content fields",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: JSON.stringify({
          hero_3d: { description: "Full-viewport hero with 3D model", layouts: ["centered", "left", "split", "full_bleed"], fields: ["heading", "subheading", "body", "ctaText", "ctaLink"] },
          features: { description: "Feature grid/cards", layouts: ["centered", "left", "split"], fields: ["heading", "items[]"] },
          specs: { description: "Technical specifications", layouts: ["centered", "split"], fields: ["heading", "items[]"] },
          showcase: { description: "Product/content showcase", layouts: ["centered", "left", "split", "full_bleed"], fields: ["heading", "body", "ctaText", "ctaLink"] },
          cta: { description: "Call-to-action section", layouts: ["centered"], fields: ["heading", "body", "ctaText", "ctaLink"] },
          footer: { description: "Page footer", layouts: ["centered", "left"], fields: ["heading", "body"] },
          custom_html: { description: "Raw HTML content section", layouts: ["centered", "full_bleed"], fields: ["customHtml"] },
          code_showcase: { description: "Code block display section", layouts: ["centered", "split"], fields: ["heading", "codeBlock"] },
        }, null, 2),
        mimeType: "application/json",
      }],
    })
  );

  // Gallery examples — one per theme preset
  for (const [theme, gallery] of Object.entries(GALLERIES)) {
    server.resource(
      `gallery-${theme.replace(/_/g, "-")}`,
      `brushstroke://gallery/${theme}`,
      {
        description: `Complete example PageSpec for the ${theme} theme preset`,
        mimeType: "application/json",
      },
      async (uri) => ({
        contents: [{
          uri: uri.href,
          text: JSON.stringify(gallery, null, 2),
          mimeType: "application/json",
        }],
      })
    );
  }
}
