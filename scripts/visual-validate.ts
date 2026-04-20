/**
 * Runtime visual validation using Playwright (Tier 2).
 * Dev dependency — not part of MCP server.
 *
 * Usage: npx tsx scripts/visual-validate.ts output.html
 * Requires: npm install -D playwright
 */

import { chromium } from "playwright";
import { readFileSync } from "fs";
import { resolve } from "path";

interface ValidationResult {
  webglSuccess: boolean;
  shaderErrors: string[];
  fps: number;
  blackScreenPercent: number;
  consoleErrors: string[];
  visualBalance: { leftLuminance: number; rightLuminance: number; balanced: boolean };
  overall: "pass" | "warn" | "fail";
}

async function validate(htmlPath: string): Promise<ValidationResult> {
  const absolutePath = resolve(htmlPath);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  // Load the HTML file
  const html = readFileSync(absolutePath, "utf-8");
  await page.setContent(html, { waitUntil: "networkidle" });

  // Wait for rendering
  await page.waitForTimeout(2000);

  // Check WebGL context
  const webglSuccess = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return false;
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return !!gl;
  });

  // Measure FPS over 2 seconds
  const fps = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let frameCount = 0;
      const start = performance.now();
      function countFrame() {
        frameCount++;
        if (performance.now() - start < 2000) {
          requestAnimationFrame(countFrame);
        } else {
          resolve(frameCount / 2);
        }
      }
      requestAnimationFrame(countFrame);
    });
  });

  // Screenshot for black screen detection and visual balance
  const screenshot = await page.screenshot({ type: "png" });
  const { blackPercent, leftLum, rightLum } = await analyzeScreenshot(page);

  await browser.close();

  const balanced = Math.abs(leftLum - rightLum) < 0.3;
  const overall =
    !webglSuccess || fps < 15 || blackPercent > 80
      ? "fail"
      : fps < 30 || blackPercent > 50 || !balanced
        ? "warn"
        : "pass";

  return {
    webglSuccess,
    shaderErrors: consoleErrors.filter(e => e.includes("shader") || e.includes("GLSL") || e.includes("compile")),
    fps: Math.round(fps),
    blackScreenPercent: blackPercent,
    consoleErrors,
    visualBalance: { leftLuminance: leftLum, rightLuminance: rightLum, balanced },
    overall,
  };
}

async function analyzeScreenshot(page: import("playwright").Page): Promise<{
  blackPercent: number;
  leftLum: number;
  rightLum: number;
}> {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Draw page to canvas
    // Note: This is approximate — for exact pixel analysis, use the screenshot buffer
    // For now, check the WebGL canvas directly
    const webglCanvas = document.querySelector("canvas");
    if (!webglCanvas) return { blackPercent: 100, leftLum: 0, rightLum: 0 };

    ctx.drawImage(webglCanvas, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let blackCount = 0;
    let leftLumSum = 0;
    let rightLumSum = 0;
    let leftCount = 0;
    let rightCount = 0;
    const halfWidth = canvas.width / 2;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] / 255;
      const g = pixels[i + 1] / 255;
      const b = pixels[i + 2] / 255;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      if (lum < 0.05) blackCount++;

      const pixelIndex = i / 4;
      const x = pixelIndex % canvas.width;
      if (x < halfWidth) {
        leftLumSum += lum;
        leftCount++;
      } else {
        rightLumSum += lum;
        rightCount++;
      }
    }

    const totalPixels = pixels.length / 4;
    return {
      blackPercent: Math.round((blackCount / totalPixels) * 100),
      leftLum: leftCount > 0 ? Math.round((leftLumSum / leftCount) * 100) / 100 : 0,
      rightLum: rightCount > 0 ? Math.round((rightLumSum / rightCount) * 100) / 100 : 0,
    };
  });
}

// CLI entry point
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: npx tsx scripts/visual-validate.ts <output.html>");
  process.exit(1);
}

validate(args[0]).then((result) => {
  console.log("\n=== Visual Validation Report ===\n");
  console.log(`WebGL:          ${result.webglSuccess ? "OK" : "FAILED"}`);
  console.log(`Shader Errors:  ${result.shaderErrors.length === 0 ? "None" : result.shaderErrors.join(", ")}`);
  console.log(`FPS:            ${result.fps} ${result.fps >= 30 ? "(OK)" : result.fps >= 15 ? "(LOW)" : "(CRITICAL)"}`);
  console.log(`Black Screen:   ${result.blackScreenPercent}% ${result.blackScreenPercent <= 50 ? "(OK)" : "(WARNING)"}`);
  console.log(`Visual Balance: L=${result.visualBalance.leftLuminance} R=${result.visualBalance.rightLuminance} ${result.visualBalance.balanced ? "(OK)" : "(IMBALANCED)"}`);
  console.log(`Console Errors: ${result.consoleErrors.length}`);
  result.consoleErrors.forEach(e => console.log(`  - ${e}`));
  console.log(`\nOverall: ${result.overall.toUpperCase()}\n`);

  process.exit(result.overall === "fail" ? 1 : 0);
}).catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
