/**
 * Reusable Playwright page capture.
 * Extracted from page-capture tool for shared use.
 */

export interface CaptureOptions {
  scrollPositions?: number[];
  viewport?: { width: number; height: number };
  maxWidth?: number;
  postLoadDelay?: number;
  waitForCanvas?: boolean;
}

export interface CaptureResult {
  images: Array<{ base64: string; scrollPosition: number }>;
  pageHeight: number;
}

export async function capturePagePreviews(
  html: string,
  options?: CaptureOptions
): Promise<CaptureResult> {
  const {
    scrollPositions = [0, 0.5, 1.0],
    viewport = { width: 1440, height: 900 },
    maxWidth = 720,
    postLoadDelay = 3000,
    waitForCanvas = true,
  } = options ?? {};

  const { chromium } = await import("playwright").catch(() => {
    throw new Error(
      "Playwright not installed. Run: npm install playwright && npx playwright install chromium"
    );
  });

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--disable-web-security",
    ],
  });

  try {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page.evaluate(() => document.fonts.ready);

    if (waitForCanvas) {
      await page.waitForSelector("canvas", { timeout: 10000 }).catch(() => {});
    }

    await page.waitForTimeout(postLoadDelay);

    const pageHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ) - window.innerHeight;
    });

    const images: Array<{ base64: string; scrollPosition: number }> = [];

    for (const scrollFraction of scrollPositions) {
      const scrollY = Math.round(pageHeight * scrollFraction);
      await page.evaluate((y: number) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(500);

      const screenshotBuffer = await page.screenshot({ type: "png" });
      const resized = await resizeScreenshot(page, screenshotBuffer, maxWidth);

      images.push({
        base64: resized.toString("base64"),
        scrollPosition: scrollFraction,
      });
    }

    await context.close();

    return { images, pageHeight: pageHeight + viewport.height };
  } finally {
    await browser.close();
  }
}

async function resizeScreenshot(
  page: import("playwright").Page,
  buffer: Buffer,
  maxWidth: number
): Promise<Buffer> {
  const base64Input = buffer.toString("base64");

  const resizedBase64 = await page.evaluate(
    async ({ imgData, maxW }: { imgData: string; maxW: number }) => {
      return new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxW) {
            h = Math.round(h * (maxW / w));
            w = maxW;
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/png").split(",")[1]);
        };
        img.src = `data:image/png;base64,${imgData}`;
      });
    },
    { imgData: base64Input, maxW: maxWidth }
  );

  return Buffer.from(resizedBase64, "base64");
}
