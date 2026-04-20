/**
 * Video/Frame Capture System for Animation Validation
 *
 * Uses Playwright to capture HTML animations as video or frame sequences
 */

import { CaptureConfig, Interaction } from "./types.js";

export interface CaptureResult {
  videoPath?: string;
  frames: Buffer[];
  frameCount: number;
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
}

export class AnimationCapture {
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      await import("playwright");
      this.initialized = true;
    } catch {
      throw new Error(
        "Playwright not installed. Run: npm install playwright"
      );
    }
  }

  /**
   * Capture animation as frame sequence
   */
  async captureFrames(
    htmlContent: string,
    config: CaptureConfig
  ): Promise<CaptureResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const { chromium } = await import("playwright");

    const browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--enable-webgl",
        "--ignore-gpu-blocklist",
      ],
    });

    try {
      const context = await browser.newContext({
        viewport: {
          width: config.width,
          height: config.height,
        },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      // Load HTML content
      await page.setContent(htmlContent, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Wait for any start delay
      if (config.startDelay) {
        await new Promise(r => setTimeout(r, config.startDelay));
      }

      // Wait for WebGL/Three.js to initialize
      await page.waitForFunction(() => {
        return document.querySelector("canvas") !== null;
      }, { timeout: 10000 });

      // Give extra time for shaders to compile
      await new Promise(r => setTimeout(r, 2000));

      const frames: Buffer[] = [];
      const frameInterval = 1000 / config.fps;
      const totalFrames = Math.floor(config.duration * config.fps);

      // Execute interactions
      if (config.interactions) {
        await this.executeInteractions(page, config.interactions);
      }

      // Capture frames
      const startTime = Date.now();
      for (let i = 0; i < totalFrames; i++) {
        const frameStart = Date.now();

        // Scroll animation handling
        if (config.scrollSpeed) {
          const scrollY = (i / totalFrames) * config.scrollSpeed * config.duration;
          await page.evaluate((y: number) => window.scrollTo(0, y), scrollY);
        }

        // Capture screenshot
        const screenshot = await page.screenshot({ type: "png" });
        frames.push(screenshot);

        // Wait for next frame
        const elapsed = Date.now() - frameStart;
        const waitTime = Math.max(0, frameInterval - elapsed);
        if (waitTime > 0) {
          await new Promise(r => setTimeout(r, waitTime));
        }
      }

      const actualDuration = (Date.now() - startTime) / 1000;

      return {
        frames,
        frameCount: frames.length,
        duration: actualDuration,
        fps: config.fps,
        resolution: {
          width: config.width,
          height: config.height,
        },
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Capture animation as video using canvas recording
   */
  async captureVideo(
    htmlContent: string,
    config: CaptureConfig,
    outputPath: string
  ): Promise<CaptureResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const { chromium } = await import("playwright");
    const fs = await import("fs");

    const browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--enable-webgl",
      ],
    });

    try {
      const context = await browser.newContext({
        viewport: {
          width: config.width,
          height: config.height,
        },
      });
      const page = await context.newPage();

      await page.setContent(htmlContent, {
        waitUntil: "networkidle",
      });

      await page.waitForFunction(() => {
        return document.querySelector("canvas") !== null;
      }, { timeout: 10000 });

      await new Promise(r => setTimeout(r, 2000));

      // Start recording
      await page.evaluate((duration: number) => {
        const canvas = document.querySelector("canvas") as HTMLCanvasElement;
        if (!canvas) return;

        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9",
        });

        (window as any).recordedChunks = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            (window as any).recordedChunks.push(event.data);
          }
        };

        mediaRecorder.start(100);

        setTimeout(() => {
          mediaRecorder.stop();
        }, duration * 1000);
      }, config.duration);

      // Wait for recording to complete
      await new Promise(r => setTimeout(r, config.duration * 1000 + 1000));

      // Get recorded data
      const recordedChunks = await page.evaluate(() => {
        return (window as any).recordedChunks;
      });

      // Save as webm
      const webmPath = outputPath.replace(".mp4", ".webm");
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(webmPath, buffer);

      // Also capture frames for analysis
      const frameResult = await this.captureFrames(htmlContent, {
        ...config,
        duration: Math.min(config.duration, 5),
        fps: 3,
      });

      return {
        videoPath: webmPath,
        frames: frameResult.frames,
        frameCount: frameResult.frames.length,
        duration: config.duration,
        fps: config.fps,
        resolution: {
          width: config.width,
          height: config.height,
        },
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Execute interaction sequence
   */
  private async executeInteractions(
    page: any,
    interactions: Interaction[]
  ): Promise<void> {
    const sorted = [...interactions].sort((a, b) => a.delay - b.delay);

    for (const interaction of sorted) {
      await new Promise(r => setTimeout(r, interaction.delay));

      switch (interaction.type) {
        case "scroll": {
          const { x = 0, y = 0 } = interaction.params as { x?: number; y?: number };
          await page.evaluate(([scrollX, scrollY]: [number, number]) => {
            window.scrollTo(scrollX, scrollY);
          }, [x, y]);
          break;
        }

        case "click": {
          const { selector } = interaction.params as { selector: string };
          await page.click(selector);
          break;
        }

        case "mousemove": {
          const { mx, my } = interaction.params as { mx: number; my: number };
          await page.mouse.move(mx, my);
          break;
        }

        case "hover": {
          const { hoverSelector } = interaction.params as { hoverSelector: string };
          await page.hover(hoverSelector);
          break;
        }

        case "wait": {
          const { ms = 1000 } = interaction.params as { ms?: number };
          await new Promise(r => setTimeout(r, ms));
          break;
        }
      }
    }
  }

  /**
   * Extract frames from video file (requires ffmpeg)
   */
  async extractFramesFromVideo(
    videoPath: string,
    interval: number = 3
  ): Promise<Buffer[]> {
    const fs = await import("fs");
    const path = await import("path");
    const { execSync } = await import("child_process");

    try {
      execSync("ffmpeg -version", { stdio: "ignore" });
    } catch {
      throw new Error("ffmpeg not installed. Required for video frame extraction.");
    }

    const tempDir = path.join(process.cwd(), "temp_frames");
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      execSync(
        `ffmpeg -i "${videoPath}" -vf "fps=1/${interval}" -q:v 2 "${tempDir}/frame_%04d.png"`,
        { stdio: "ignore" }
      );

      const files = fs.readdirSync(tempDir).filter((f: string) => f.endsWith(".png"));
      const frames = files
        .sort()
        .map((f: string) => fs.readFileSync(path.join(tempDir, f)));

      return frames;
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}
