/**
 * Page Screenshot Capture Tool
 *
 * Renders HTML in a headless Playwright browser and captures screenshots
 * at multiple scroll positions for visual design evaluation.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { capturePagePreviews } from "../utils/page-preview.js";

export function registerPageCapture(server: McpServer): void {
  server.tool(
    "capture_page_screenshots",
    "Render an HTML page in a headless browser and capture screenshots at multiple scroll positions. Returns base64 PNG images suitable for visual evaluation. Requires Playwright.",
    {
      htmlContent: z.string().describe("Full HTML content to render"),
      viewports: z.array(z.object({
        width: z.number().default(1440),
        height: z.number().default(900),
        label: z.string().optional(),
      })).optional().default([{ width: 1440, height: 900, label: "desktop" }])
        .describe("Viewport sizes to capture"),
      scrollPositions: z.array(z.number().min(0).max(1))
        .optional().default([0, 0.25, 0.5, 0.75, 1.0])
        .describe("Scroll positions as fractions of total scroll height"),
      waitForCanvas: z.boolean().optional().default(true)
        .describe("Wait for a <canvas> element before capturing"),
      postLoadDelay: z.number().optional().default(3000)
        .describe("Milliseconds to wait after page load before first capture"),
    },
    async (params) => {
      try {
        const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [];
        const captureInfo: Array<{
          viewport: string;
          scrollPosition: number;
          pageHeight: number;
          dimensions: { width: number; height: number };
        }> = [];

        for (const viewport of params.viewports) {
          const label = viewport.label ?? `${viewport.width}x${viewport.height}`;

          const result = await capturePagePreviews(params.htmlContent, {
            scrollPositions: params.scrollPositions,
            viewport: { width: viewport.width, height: viewport.height },
            maxWidth: 720,
            postLoadDelay: params.postLoadDelay,
            waitForCanvas: params.waitForCanvas,
          });

          for (const img of result.images) {
            content.push({
              type: "image" as const,
              data: img.base64,
              mimeType: "image/png",
            });

            captureInfo.push({
              viewport: label,
              scrollPosition: img.scrollPosition,
              pageHeight: result.pageHeight,
              dimensions: { width: Math.min(viewport.width, 720), height: viewport.height },
            });
          }
        }

        // Add metadata as text
        content.push({
          type: "text" as const,
          text: `--- Capture Metadata ---\n${JSON.stringify({
            totalScreenshots: captureInfo.length,
            captures: captureInfo,
          }, null, 2)}`,
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
