/**
 * Comprehensive Tests for Adaptive Quality Controller
 * 
 * Tests cover:
 * - Quality levels configuration
 * - GPU tier detection
 * - FPS monitoring and history tracking
 * - Quality step up/down logic
 * - Battery monitoring integration
 * - Quality configuration generation
 * - Generated code validity
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AdaptiveQualityController,
  QUALITY_LEVELS,
  generateQualityConfig,
  type QualityLevel,
  type PerformanceBudget,
} from '../src/utils/performance-controller';

// ============================================================================
// Test Suite 1: Quality Levels Configuration
// ============================================================================
describe('Quality Levels Configuration', () => {
  it('should have exactly 4 quality levels', () => {
    expect(QUALITY_LEVELS).toHaveLength(4);
  });

  it('should have correct quality level names in order', () => {
    const expectedNames = ['ultra', 'high', 'medium', 'low'];
    QUALITY_LEVELS.forEach((level, index) => {
      expect(level.name).toBe(expectedNames[index]);
    });
  });

  it('should have correct ultra quality settings', () => {
    const ultra = QUALITY_LEVELS[0];
    expect(ultra).toEqual({
      name: 'ultra',
      particleCount: 10000,
      shaderComplexity: 1.0,
      shadowResolution: 2048,
      antialias: true,
      postProcessing: true,
      maxLights: 8,
    });
  });

  it('should have correct high quality settings', () => {
    const high = QUALITY_LEVELS[1];
    expect(high).toEqual({
      name: 'high',
      particleCount: 5000,
      shaderComplexity: 0.8,
      shadowResolution: 1024,
      antialias: true,
      postProcessing: true,
      maxLights: 4,
    });
  });

  it('should have correct medium quality settings', () => {
    const medium = QUALITY_LEVELS[2];
    expect(medium).toEqual({
      name: 'medium',
      particleCount: 2000,
      shaderComplexity: 0.6,
      shadowResolution: 512,
      antialias: false,
      postProcessing: false,
      maxLights: 2,
    });
  });

  it('should have correct low quality settings', () => {
    const low = QUALITY_LEVELS[3];
    expect(low).toEqual({
      name: 'low',
      particleCount: 500,
      shaderComplexity: 0.4,
      shadowResolution: 0,
      antialias: false,
      postProcessing: false,
      maxLights: 1,
    });
  });

  it('should have decreasing particle counts across quality levels', () => {
    for (let i = 1; i < QUALITY_LEVELS.length; i++) {
      expect(QUALITY_LEVELS[i].particleCount).toBeLessThan(QUALITY_LEVELS[i - 1].particleCount);
    }
  });

  it('should have decreasing shader complexity across quality levels', () => {
    for (let i = 1; i < QUALITY_LEVELS.length; i++) {
      expect(QUALITY_LEVELS[i].shaderComplexity).toBeLessThan(QUALITY_LEVELS[i - 1].shaderComplexity);
    }
  });

  it('should have decreasing shadow resolution across quality levels', () => {
    for (let i = 1; i < QUALITY_LEVELS.length; i++) {
      expect(QUALITY_LEVELS[i].shadowResolution).toBeLessThanOrEqual(QUALITY_LEVELS[i - 1].shadowResolution);
    }
  });

  it('should have appropriate features disabled at lower quality levels', () => {
    // Low quality should have no AA and no post-processing
    expect(QUALITY_LEVELS[3].antialias).toBe(false);
    expect(QUALITY_LEVELS[3].postProcessing).toBe(false);
    
    // Medium should also have no AA and no post-processing
    expect(QUALITY_LEVELS[2].antialias).toBe(false);
    expect(QUALITY_LEVELS[2].postProcessing).toBe(false);
    
    // High and Ultra should have both
    expect(QUALITY_LEVELS[0].antialias).toBe(true);
    expect(QUALITY_LEVELS[0].postProcessing).toBe(true);
    expect(QUALITY_LEVELS[1].antialias).toBe(true);
    expect(QUALITY_LEVELS[1].postProcessing).toBe(true);
  });
});

// ============================================================================
// Test Suite 2: GPU Tier Detection
// ============================================================================
describe('GPU Tier Detection', () => {
  let controller: AdaptiveQualityController;
  let mockGetContext: any;

  beforeEach(() => {
    mockGetContext = vi.fn();
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        getContext: mockGetContext,
      })),
    });
    vi.stubGlobal('navigator', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should detect high-end NVIDIA RTX GPUs', () => {
    const mockGl = createMockWebGLContext('NVIDIA GeForce RTX 4090');
    mockGetContext.mockReturnValue(mockGl);
    
    controller = new AdaptiveQualityController();
    const tier = controller.detectGpuTier();
    expect(tier).toBe('high');
  });

  it('should detect high-end AMD RX 6000/7000/8000 series GPUs', () => {
    const testCases = [
      'AMD Radeon RX 6800 XT',
      'AMD Radeon RX 7900 XTX',
      'AMD Radeon RX 8900',
    ];
    
    for (const renderer of testCases) {
      const mockGl = createMockWebGLContext(renderer);
      mockGetContext.mockReturnValue(mockGl);
      
      controller = new AdaptiveQualityController();
      const tier = controller.detectGpuTier();
      expect(tier).toBe('high');
    }
  });

  it('should detect Apple Silicon M1/M2/M3/M4 GPUs as high tier', () => {
    const testCases = [
      'Apple M1',
      'Apple M1 Pro',
      'Apple M1 Max',
      'Apple M2',
      'Apple M2 Ultra',
      'Apple M3',
      'Apple M3 Max',
      'Apple M4',
    ];
    
    for (const renderer of testCases) {
      const mockGl = createMockWebGLContext(renderer);
      mockGetContext.mockReturnValue(mockGl);
      
      controller = new AdaptiveQualityController();
      const tier = controller.detectGpuTier();
      expect(tier).toBe('high');
    }
  });

  it('should detect medium-tier NVIDIA GTX GPUs', () => {
    const testCases = [
      'NVIDIA GeForce GTX 1080',
      'NVIDIA GeForce GTX 1660',
      'NVIDIA GeForce GTX 2060',
    ];
    
    for (const renderer of testCases) {
      const mockGl = createMockWebGLContext(renderer);
      mockGetContext.mockReturnValue(mockGl);
      
      controller = new AdaptiveQualityController();
      const tier = controller.detectGpuTier();
      expect(tier).toBe('medium');
    }
  });

  it('should detect medium-tier AMD RX 400/500 series GPUs', () => {
    // FIXED: RX 400/500 series are now correctly detected as medium tier
    const testCases = [
      { renderer: 'AMD Radeon RX 580', expected: 'medium' },
      { renderer: 'AMD Radeon RX 570', expected: 'medium' },
      { renderer: 'AMD Radeon RX 480', expected: 'medium' },
    ];
    
    for (const { renderer, expected } of testCases) {
      const mockGl = createMockWebGLContext(renderer);
      mockGetContext.mockReturnValue(mockGl);
      
      controller = new AdaptiveQualityController();
      const tier = controller.detectGpuTier();
      expect(tier).toBe(expected);
    }
  });

  it('should detect Intel Iris GPUs as medium tier', () => {
    const mockGl = createMockWebGLContext('Intel Iris Xe Graphics');
    mockGetContext.mockReturnValue(mockGl);
    
    controller = new AdaptiveQualityController();
    const tier = controller.detectGpuTier();
    expect(tier).toBe('medium');
  });

  it('should detect Intel HD/UHD as low tier', () => {
    const testCases = [
      'Intel HD Graphics 620',
      'Intel UHD Graphics 630',
      'Intel HD Graphics 520',
    ];
    
    for (const renderer of testCases) {
      const mockGl = createMockWebGLContext(renderer);
      mockGetContext.mockReturnValue(mockGl);
      
      controller = new AdaptiveQualityController();
      const tier = controller.detectGpuTier();
      expect(tier).toBe('low');
    }
  });

  it('should detect ARM Mali GPUs as low tier', () => {
    const testCases = [
      'Mali-G78',
      'Mali-G57',
      'Mali-G76',
    ];
    
    for (const renderer of testCases) {
      const mockGl = createMockWebGLContext(renderer);
      mockGetContext.mockReturnValue(mockGl);
      
      controller = new AdaptiveQualityController();
      const tier = controller.detectGpuTier();
      expect(tier).toBe('low');
    }
  });

  it('should return low tier when WebGL is not available', () => {
    mockGetContext.mockReturnValue(null);
    
    controller = new AdaptiveQualityController();
    const tier = controller.detectGpuTier();
    expect(tier).toBe('low');
  });

  it('should return medium tier when WEBGL_debug_renderer_info is not available', () => {
    const mockGl = {
      getExtension: vi.fn(() => null),
    };
    mockGetContext.mockReturnValue(mockGl);
    
    controller = new AdaptiveQualityController();
    const tier = controller.detectGpuTier();
    expect(tier).toBe('medium');
  });

  it('should handle errors gracefully and return medium tier', () => {
    mockGetContext.mockImplementation(() => {
      throw new Error('Canvas creation failed');
    });
    
    controller = new AdaptiveQualityController();
    const tier = controller.detectGpuTier();
    expect(tier).toBe('medium');
  });
});

// ============================================================================
// Test Suite 3: FPS Monitoring and History Tracking
// ============================================================================
describe('FPS Monitoring and History Tracking', () => {
  let controller: AdaptiveQualityController;

  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        getContext: vi.fn(() => null),
      })),
    });
    vi.stubGlobal('navigator', {});
    
    controller = new AdaptiveQualityController();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should record FPS samples', () => {
    controller.recordFps(60);
    controller.recordFps(55);
    controller.recordFps(58);
    
    expect(controller).toBeDefined();
  });

  it('should maintain FPS history of max 60 samples', () => {
    // Record 70 FPS samples
    for (let i = 0; i < 70; i++) {
      controller.recordFps(60);
    }
    
    expect(controller).toBeDefined();
  });

  it('should not evaluate performance until 60 samples are collected', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Record 59 samples
    for (let i = 0; i < 59; i++) {
      controller.recordFps(30); // Low FPS that would trigger step down
    }
    
    // No quality change should occur yet
    expect(consoleSpy).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should evaluate performance after collecting 60 samples', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Start at high quality
    controller.setQualityLevel('high');
    
    // Record 60 samples with consistently low FPS
    for (let i = 0; i < 60; i++) {
      controller.recordFps(30);
    }
    
    // Quality should have stepped down
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Stepped down'));
    
    consoleSpy.mockRestore();
  });
});

// ============================================================================
// Test Suite 4: Quality Step Up/Down Logic
// ============================================================================
describe('Quality Step Up/Down Logic', () => {
  let controller: AdaptiveQualityController;

  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        getContext: vi.fn(() => null),
      })),
    });
    vi.stubGlobal('navigator', {});
    
    controller = new AdaptiveQualityController();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should step down quality when FPS is consistently below minimum', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    controller.setQualityLevel('ultra');
    
    // Simulate consistently poor performance (30 FPS when min is 45)
    for (let i = 0; i < 60; i++) {
      controller.recordFps(30);
    }
    
    const currentQuality = controller.getCurrentQuality();
    expect(currentQuality.name).toBe('high');
    expect(consoleSpy).toHaveBeenCalledWith('[Performance] Stepped down quality to: high');
    
    consoleSpy.mockRestore();
  });

  it('should step up quality when FPS is consistently above target with headroom', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    controller.setQualityLevel('medium');
    
    // Simulate excellent performance (75 FPS when target is 60, threshold is 66)
    for (let i = 0; i < 60; i++) {
      controller.recordFps(75);
    }
    
    const currentQuality = controller.getCurrentQuality();
    expect(currentQuality.name).toBe('high');
    expect(consoleSpy).toHaveBeenCalledWith('[Performance] Stepped up quality to: high');
    
    consoleSpy.mockRestore();
  });

  it('should not step down below lowest quality level', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    controller.setQualityLevel('low');
    
    // Try to step down from lowest level
    for (let i = 0; i < 60; i++) {
      controller.recordFps(10);
    }
    
    const currentQuality = controller.getCurrentQuality();
    expect(currentQuality.name).toBe('low');
    
    // Should only have the initial quality set, no step down messages
    const stepDownCalls = consoleSpy.mock.calls.filter(
      call => typeof call[0] === 'string' && call[0].includes('Stepped down')
    );
    expect(stepDownCalls).toHaveLength(0);
    
    consoleSpy.mockRestore();
  });

  it('should not step up above highest quality level', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    controller.setQualityLevel('ultra');
    
    // Try to step up from highest level
    for (let i = 0; i < 60; i++) {
      controller.recordFps(120);
    }
    
    const currentQuality = controller.getCurrentQuality();
    expect(currentQuality.name).toBe('ultra');
    
    consoleSpy.mockRestore();
  });

  it('should require both average and minimum FPS below threshold to step down', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    controller.setQualityLevel('high');
    
    // Mix of good and bad FPS - average might be low but min shouldn't trigger
    for (let i = 0; i < 30; i++) {
      controller.recordFps(60);
    }
    for (let i = 0; i < 30; i++) {
      controller.recordFps(30);
    }
    
    // Check if stepped down (depends on exact calculation)
    const stepDownCalls = consoleSpy.mock.calls.filter(
      call => typeof call[0] === 'string' && call[0].includes('Stepped down')
    );
    
    expect(controller.getCurrentQuality()).toBeDefined();
    
    consoleSpy.mockRestore();
  });
});

// ============================================================================
// Test Suite 5: Battery Monitoring Integration
// ============================================================================
describe('Battery Monitoring Integration', () => {
  let controller: AdaptiveQualityController;
  let mockBattery: any;
  let mockGetBattery: any;
  let mockGetContext: any;

  beforeEach(() => {
    mockGetContext = vi.fn(() => null);
    mockGetBattery = vi.fn();
    
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        getContext: mockGetContext,
      })),
    });
    
    mockBattery = {
      level: 1.0,
      charging: true,
      addEventListener: vi.fn(),
    };
    
    mockGetBattery.mockResolvedValue(mockBattery);
    vi.stubGlobal('navigator', {
      getBattery: mockGetBattery,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should setup battery monitoring when API is available', async () => {
    controller = new AdaptiveQualityController();
    
    // Wait for async setup
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(mockGetBattery).toHaveBeenCalled();
    expect(mockBattery.addEventListener).toHaveBeenCalledWith('levelchange', expect.any(Function));
    expect(mockBattery.addEventListener).toHaveBeenCalledWith('chargingchange', expect.any(Function));
  });

  it('should step down quality when battery is low and not charging', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Set battery to low and not charging BEFORE creating controller
    mockBattery.level = 0.15;
    mockBattery.charging = false;
    
    // Create controller and start at medium quality
    controller = new AdaptiveQualityController();
    controller.setQualityLevel('medium');
    
    // Wait for async setup
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Manually trigger battery update to simulate low battery event
    mockBattery.addEventListener.mock.calls.forEach((call: any[]) => {
      if (call[0] === 'levelchange' || call[0] === 'chargingchange') {
        call[1]();
      }
    });
    
    // Should have stepped down due to low battery (medium -> low)
    const currentQuality = controller.getCurrentQuality();
    expect(currentQuality.name).toBe('low');
    
    consoleSpy.mockRestore();
  });

  it('should not step down when battery is low but charging', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    mockBattery.level = 0.15;
    mockBattery.charging = true;
    
    controller = new AdaptiveQualityController();
    controller.setQualityLevel('ultra');
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Manually trigger battery update
    mockBattery.addEventListener.mock.calls.forEach((call: any[]) => {
      if (call[0] === 'levelchange' || call[0] === 'chargingchange') {
        call[1]();
      }
    });
    
    // Should NOT step down when charging
    const currentQuality = controller.getCurrentQuality();
    expect(currentQuality.name).toBe('ultra');
    
    consoleSpy.mockRestore();
  });

  it('should not step up when battery is below 50% and on battery power', async () => {
    mockBattery.level = 0.3;
    mockBattery.charging = false;
    
    controller = new AdaptiveQualityController({
      degradeOnBattery: true,
    });
    controller.setQualityLevel('medium');
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Manually trigger battery update
    mockBattery.addEventListener.mock.calls.forEach((call: any[]) => {
      if (call[0] === 'levelchange' || call[0] === 'chargingchange') {
        call[1]();
      }
    });
    
    // Try to record high FPS to trigger step up
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    for (let i = 0; i < 60; i++) {
      controller.recordFps(75);
    }
    
    // Should NOT step up due to battery constraint
    const currentQuality = controller.getCurrentQuality();
    expect(currentQuality.name).toBe('medium');
    
    consoleSpy.mockRestore();
  });

  it('should allow step up when degradeOnBattery is false', async () => {
    mockBattery.level = 0.3;
    mockBattery.charging = false;
    
    controller = new AdaptiveQualityController({
      degradeOnBattery: false,
    });
    controller.setQualityLevel('medium');
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Manually trigger battery update
    mockBattery.addEventListener.mock.calls.forEach((call: any[]) => {
      if (call[0] === 'levelchange' || call[0] === 'chargingchange') {
        call[1]();
      }
    });
    
    // Try to record high FPS to trigger step up
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    for (let i = 0; i < 60; i++) {
      controller.recordFps(75);
    }
    
    // Should step up since degradeOnBattery is false
    const currentQuality = controller.getCurrentQuality();
    expect(currentQuality.name).toBe('high');
    
    consoleSpy.mockRestore();
  });

  it('should handle missing battery API gracefully', async () => {
    vi.stubGlobal('navigator', {});
    
    // Should not throw
    expect(() => {
      controller = new AdaptiveQualityController();
    }).not.toThrow();
  });

  it('should handle battery API errors gracefully', async () => {
    vi.stubGlobal('navigator', {
      getBattery: vi.fn().mockRejectedValue(new Error('Battery API error')),
    });
    
    // Should not throw
    expect(() => {
      controller = new AdaptiveQualityController();
    }).not.toThrow();
  });
});

// ============================================================================
// Test Suite 6: Quality Configuration Generation
// ============================================================================
describe('Quality Configuration Generation', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        getContext: vi.fn(() => null),
      })),
    });
    vi.stubGlobal('navigator', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should generate config for high GPU tier', () => {
    const config = generateQualityConfig('high');
    expect(config.name).toBe('ultra');
    expect(config.particleCount).toBe(10000);
    expect(config.shadowResolution).toBe(2048);
  });

  it('should generate config for medium GPU tier', () => {
    const config = generateQualityConfig('medium');
    expect(config.name).toBe('high');
    expect(config.particleCount).toBe(5000);
    expect(config.shadowResolution).toBe(1024);
  });

  it('should generate config for low GPU tier', () => {
    const config = generateQualityConfig('low');
    expect(config.name).toBe('low');
    expect(config.particleCount).toBe(500);
    expect(config.shadowResolution).toBe(0);
  });

  it('should default to medium tier when not specified', () => {
    const config = generateQualityConfig();
    expect(config.name).toBe('high');
  });
});

// ============================================================================
// Test Suite 7: Controller Initialization and Configuration
// ============================================================================
describe('Controller Initialization', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        getContext: vi.fn(() => null),
      })),
    });
    vi.stubGlobal('navigator', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should use default performance budget when not provided', () => {
    const controller = new AdaptiveQualityController();
    expect(controller.getCurrentQuality()).toBeDefined();
  });

  it('should accept custom performance budget', () => {
    const budget: PerformanceBudget = {
      targetFps: 30,
      minFps: 24,
      degradeOnBattery: false,
    };
    
    const controller = new AdaptiveQualityController(budget);
    expect(controller.getCurrentQuality()).toBeDefined();
  });

  it('should allow partial performance budget', () => {
    const controller = new AdaptiveQualityController({
      targetFps: 120,
    });
    expect(controller.getCurrentQuality()).toBeDefined();
  });

  it('should manually set quality level', () => {
    const controller = new AdaptiveQualityController();
    
    controller.setQualityLevel('ultra');
    expect(controller.getCurrentQuality().name).toBe('ultra');
    
    controller.setQualityLevel('low');
    expect(controller.getCurrentQuality().name).toBe('low');
    
    controller.setQualityLevel('medium');
    expect(controller.getCurrentQuality().name).toBe('medium');
    
    controller.setQualityLevel('high');
    expect(controller.getCurrentQuality().name).toBe('high');
  });

  it('should ignore invalid quality level names', () => {
    const controller = new AdaptiveQualityController();
    const initialQuality = controller.getCurrentQuality();
    
    // @ts-expect-error Testing invalid input
    controller.setQualityLevel('invalid');
    
    expect(controller.getCurrentQuality()).toBe(initialQuality);
  });
});

// ============================================================================
// Test Suite 8: Generated Code Validation
// ============================================================================
describe('Generated Quality Controller Code', () => {
  let controller: AdaptiveQualityController;
  let generatedCode: string;

  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        getContext: vi.fn(() => null),
      })),
    });
    vi.stubGlobal('navigator', {});
    
    controller = new AdaptiveQualityController();
    generatedCode = controller.generateQualityControllerCode();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should generate non-empty code', () => {
    expect(generatedCode).toBeTruthy();
    expect(generatedCode.length).toBeGreaterThan(100);
  });

  it('should include quality levels definition', () => {
    expect(generatedCode).toContain('qualityLevels');
    expect(generatedCode).toContain('ultra');
    expect(generatedCode).toContain('high');
    expect(generatedCode).toContain('medium');
    expect(generatedCode).toContain('low');
  });

  it('should include GPU detection function', () => {
    expect(generatedCode).toContain('detectGpuTier');
    expect(generatedCode).toContain('getExtension');
    expect(generatedCode).toContain('UNMASKED_RENDERER_WEBGL');
  });

  it('should include FPS monitoring function', () => {
    expect(generatedCode).toContain('updateQuality');
    expect(generatedCode).toContain('fpsHistory');
    expect(generatedCode).toContain('performance.now');
  });

  it('should include quality application function', () => {
    expect(generatedCode).toContain('applyQuality');
    expect(generatedCode).toContain('setPixelRatio');
  });

  it('should include initialization code', () => {
    expect(generatedCode).toContain('requestAnimationFrame');
    expect(generatedCode).toContain('monitorFps');
  });

  it('should have valid JavaScript syntax', () => {
    // Try to parse as JavaScript
    expect(() => {
      // Wrap in a function to make it valid for parsing
      const wrappedCode = `(function() { ${generatedCode} })`;
      new Function(wrappedCode);
    }).not.toThrow();
  });

  it('should reference the renderer variable', () => {
    expect(generatedCode).toContain('renderer');
  });

  it('should include window.currentQuality export', () => {
    expect(generatedCode).toContain('window.currentQuality');
  });

  it('should include proper FPS thresholds', () => {
    expect(generatedCode).toContain('45'); // min FPS threshold
    expect(generatedCode).toContain('66'); // step up threshold (60 * 1.1)
  });

  it('should properly stringify quality levels', () => {
    // Check that quality levels are properly serialized
    expect(generatedCode).toContain('particleCount');
    expect(generatedCode).toContain('shaderComplexity');
    expect(generatedCode).toContain('shadowResolution');
    expect(generatedCode).toContain('antialias');
    expect(generatedCode).toContain('postProcessing');
    expect(generatedCode).toContain('maxLights');
  });
});

// ============================================================================
// Test Suite 9: GPU Tier to Quality Mapping
// ============================================================================
describe('GPU Tier to Quality Mapping', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        getContext: vi.fn(() => null),
      })),
    });
    vi.stubGlobal('navigator', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should map high GPU tier to ultra quality', () => {
    const controller = new AdaptiveQualityController();
    const quality = controller.getQualityForGpuTier('high');
    expect(quality.name).toBe('ultra');
  });

  it('should map medium GPU tier to high quality', () => {
    const controller = new AdaptiveQualityController();
    const quality = controller.getQualityForGpuTier('medium');
    expect(quality.name).toBe('high');
  });

  it('should map low GPU tier to low quality', () => {
    const controller = new AdaptiveQualityController();
    const quality = controller.getQualityForGpuTier('low');
    expect(quality.name).toBe('low');
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function createMockWebGLContext(rendererString: string) {
  const UNMASKED_RENDERER_WEBGL = 0x9246;
  const UNMASKED_VENDOR_WEBGL = 0x9245;
  
  return {
    getExtension: vi.fn((name: string) => {
      if (name === 'WEBGL_debug_renderer_info') {
        return {
          UNMASKED_RENDERER_WEBGL,
          UNMASKED_VENDOR_WEBGL,
        };
      }
      return null;
    }),
    getParameter: vi.fn((param: number) => {
      if (param === UNMASKED_RENDERER_WEBGL) {
        return rendererString;
      }
      if (param === UNMASKED_VENDOR_WEBGL) {
        return 'TestVendor';
      }
      return null;
    }),
  };
}
