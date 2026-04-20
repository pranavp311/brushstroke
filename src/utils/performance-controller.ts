/**
 * Adaptive Quality Controller
 * 
 * Automatically adjusts rendering quality based on device capabilities
 * and real-time FPS monitoring.
 */

export interface QualityLevel {
  name: "ultra" | "high" | "medium" | "low";
  particleCount: number;
  shaderComplexity: number;
  shadowResolution: number;
  antialias: boolean;
  postProcessing: boolean;
  maxLights: number;
}

export const QUALITY_LEVELS: QualityLevel[] = [
  {
    name: "ultra",
    particleCount: 10000,
    shaderComplexity: 1.0,
    shadowResolution: 2048,
    antialias: true,
    postProcessing: true,
    maxLights: 8,
  },
  {
    name: "high",
    particleCount: 5000,
    shaderComplexity: 0.8,
    shadowResolution: 1024,
    antialias: true,
    postProcessing: true,
    maxLights: 4,
  },
  {
    name: "medium",
    particleCount: 2000,
    shaderComplexity: 0.6,
    shadowResolution: 512,
    antialias: false,
    postProcessing: false,
    maxLights: 2,
  },
  {
    name: "low",
    particleCount: 500,
    shaderComplexity: 0.4,
    shadowResolution: 0,
    antialias: false,
    postProcessing: false,
    maxLights: 1,
  },
];

export interface PerformanceBudget {
  targetFps: number;
  minFps: number;
  degradeOnBattery: boolean;
}

export class AdaptiveQualityController {
  private currentLevel: QualityLevel = QUALITY_LEVELS[1]; // Start at high
  private fpsHistory: number[] = [];
  private targetFps: number = 60;
  private minFps: number = 45;
  private degradeOnBattery: boolean = true;
  private batteryLevel: number = 1.0;
  private isBatteryPowered: boolean = false;

  constructor(budget?: Partial<PerformanceBudget>) {
    if (budget) {
      this.targetFps = budget.targetFps ?? 60;
      this.minFps = budget.minFps ?? 45;
      this.degradeOnBattery = budget.degradeOnBattery ?? true;
    }

    // Detect initial GPU tier and set starting quality
    const gpuTier = this.detectGpuTier();
    this.currentLevel = this.getQualityForGpuTier(gpuTier);

    // Setup battery monitoring if available
    this.setupBatteryMonitoring();
  }

  /**
   * Detect GPU tier from WebGL renderer string
   */
  detectGpuTier(): "high" | "medium" | "low" {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) return "low";

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (!debugInfo) return "medium";

      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

      // High-end GPUs (RX 6000/7000/8000 series)
      if (/NVIDIA.*RTX|AMD.*RX\s*[6-8]\d{2,3}|Apple.*M[1-4]/i.test(renderer)) {
        return "high";
      }

      // Medium GPUs (RX 400/500 series)
      if (/NVIDIA.*GTX.*(10|16|20)|AMD.*RX\s*[4-5]\d{2,3}|Intel.*Iris/i.test(renderer)) {
        return "medium";
      }

      // Low-end or integrated
      if (/Intel.*(HD|UHD)|Mali/i.test(renderer)) {
        return "low";
      }

      return "medium";
    } catch {
      return "medium";
    }
  }

  /**
   * Get appropriate quality level for GPU tier
   */
  getQualityForGpuTier(tier: "high" | "medium" | "low"): QualityLevel {
    switch (tier) {
      case "high":
        return QUALITY_LEVELS[0]; // Ultra
      case "medium":
        return QUALITY_LEVELS[1]; // High
      case "low":
        return QUALITY_LEVELS[3]; // Low
    }
  }

  /**
   * Setup battery monitoring
   */
  private async setupBatteryMonitoring(): Promise<void> {
    if ("getBattery" in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        this.updateBatteryStatus(battery);
        
        battery.addEventListener("levelchange", () => this.updateBatteryStatus(battery));
        battery.addEventListener("chargingchange", () => this.updateBatteryStatus(battery));
      } catch {
        // Battery API not available
      }
    }
  }

  private updateBatteryStatus(battery: any): void {
    this.batteryLevel = battery.level;
    this.isBatteryPowered = !battery.charging;

    // Reduce quality on low battery
    if (this.degradeOnBattery && this.isBatteryPowered && this.batteryLevel < 0.2) {
      this.stepDownQuality();
    }
  }

  /**
   * Record FPS sample and adjust quality if needed
   */
  recordFps(fps: number): void {
    this.fpsHistory.push(fps);

    // Keep last 60 samples (about 1 second at 60fps)
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }

    // Only adjust after collecting enough samples
    if (this.fpsHistory.length === 60) {
      this.evaluateAndAdjust();
    }
  }

  /**
   * Evaluate performance and adjust quality
   */
  private evaluateAndAdjust(): void {
    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const minFps = Math.min(...this.fpsHistory);

    // Step down if consistently below minimum
    if (avgFps < this.minFps && minFps < this.minFps * 0.8) {
      this.stepDownQuality();
    }
    // Step up if consistently above target with headroom
    else if (avgFps > this.targetFps * 1.1 && this.canStepUp()) {
      this.stepUpQuality();
    }

    // Clear history after adjustment
    this.fpsHistory = [];
  }

  /**
   * Step down to lower quality level
   */
  private stepDownQuality(): void {
    const currentIndex = QUALITY_LEVELS.indexOf(this.currentLevel);
    if (currentIndex < QUALITY_LEVELS.length - 1) {
      this.currentLevel = QUALITY_LEVELS[currentIndex + 1];
      console.log(`[Performance] Stepped down quality to: ${this.currentLevel.name}`);
    }
  }

  /**
   * Step up to higher quality level
   */
  private stepUpQuality(): void {
    const currentIndex = QUALITY_LEVELS.indexOf(this.currentLevel);
    if (currentIndex > 0) {
      this.currentLevel = QUALITY_LEVELS[currentIndex - 1];
      console.log(`[Performance] Stepped up quality to: ${this.currentLevel.name}`);
    }
  }

  /**
   * Check if we can step up quality
   */
  private canStepUp(): boolean {
    // Don't step up if on low battery
    if (this.degradeOnBattery && this.isBatteryPowered && this.batteryLevel < 0.5) {
      return false;
    }
    return true;
  }

  /**
   * Get current quality settings
   */
  getCurrentQuality(): QualityLevel {
    return this.currentLevel;
  }

  /**
   * Manually set quality level
   */
  setQualityLevel(levelName: QualityLevel["name"]): void {
    const level = QUALITY_LEVELS.find(l => l.name === levelName);
    if (level) {
      this.currentLevel = level;
    }
  }

  /**
   * Generate quality adaptation code for embedding
   */
  generateQualityControllerCode(): string {
    return `
// Adaptive Quality Controller
const qualityLevels = ${JSON.stringify(QUALITY_LEVELS)};
let currentQualityIndex = ${QUALITY_LEVELS.indexOf(this.currentLevel)};
const fpsHistory = [];
let lastTime = performance.now();

function detectGpuTier() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 'low';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'medium';
    
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    if (/NVIDIA.*RTX|AMD\s*RX\s*[6-8]\d{3}|Apple\s*M[1-4]/i.test(renderer)) return 'high';
    if (/NVIDIA.*GTX.*(10|16|20)|AMD\s*RX\s*[4-5]\d{3}|Intel.*Iris/i.test(renderer)) return 'medium';
    return 'low';
  } catch {
    return 'medium';
  }
}

function updateQuality() {
  const now = performance.now();
  const fps = 1000 / (now - lastTime);
  lastTime = now;
  
  fpsHistory.push(fps);
  if (fpsHistory.length > 60) fpsHistory.shift();
  
  if (fpsHistory.length === 60) {
    const avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
    
    if (avgFps < 45) {
      if (currentQualityIndex < qualityLevels.length - 1) {
        currentQualityIndex++;
        applyQuality(qualityLevels[currentQualityIndex]);
      }
    } else if (avgFps > 66 && currentQualityIndex > 0) {
      currentQualityIndex--;
      applyQuality(qualityLevels[currentQualityIndex]);
    }
    
    fpsHistory.length = 0;
  }
}

function applyQuality(quality) {
  console.log('[Quality] Setting to:', quality.name);
  // Apply quality settings to renderer
  if (renderer) {
    renderer.setPixelRatio(quality.antialias ? Math.min(window.devicePixelRatio, 2) : 1);
  }
  // Update particle counts, shadow maps, etc.
  window.currentQuality = quality;
}

// Initialize
applyQuality(qualityLevels[currentQualityIndex]);

// Monitor FPS
function monitorFps() {
  updateQuality();
  requestAnimationFrame(monitorFps);
}
requestAnimationFrame(monitorFps);
`;
  }
}

/**
 * Generate static quality configuration based on GPU tier
 */
export function generateQualityConfig(gpuTier: "high" | "medium" | "low" = "medium"): QualityLevel {
  const controller = new AdaptiveQualityController();
  return controller.getQualityForGpuTier(gpuTier);
}
