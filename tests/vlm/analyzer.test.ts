/**
 * VLM Animation Analyzer Tests
 * Tests for validation criteria, issue compilation, and score calculation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { VLMAnimationAnalyzer } from "../../src/validation/vlm/analyzer.js";
import { VLMClient } from "../../src/validation/vlm/client.js";
import {
  ValidationJob,
  ValidationCriteria,
  DEFAULT_VALIDATION_CRITERIA,
} from "../../src/validation/vlm/types.js";

// Mock dependencies
vi.mock("../../src/validation/vlm/capture.js", () => ({
  AnimationCapture: vi.fn().mockImplementation(() => ({
    captureFrames: vi.fn().mockResolvedValue({
      frames: [Buffer.from("frame1"), Buffer.from("frame2"), Buffer.from("frame3")],
      frameCount: 3,
      duration: 3,
      fps: 1,
      resolution: { width: 1920, height: 1080 },
    }),
  })),
}));

describe("VLMAnimationAnalyzer", () => {
  let mockVLMClient: VLMClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockVLMClient = {
      analyzeImage: vi.fn().mockResolvedValue({
        content: JSON.stringify({
          description: "Frame shows smooth animation",
          quality: 85,
          issues: [],
          dominantColors: ["#FF0000", "#00FF00"],
          motionDetected: true,
          motionDirection: "horizontal",
        }),
      }),
      analyzeImageSequence: vi.fn().mockResolvedValue({
        content: JSON.stringify({
          temporalIssues: [],
        }),
      }),
    } as unknown as VLMClient;
  });

  describe("Basic Analysis", () => {
    it("should analyze a validation job and return results", async () => {
      const analyzer = new VLMAnimationAnalyzer({ vlmClient: mockVLMClient });
      const job: ValidationJob = {
        id: "test-job-1",
        htmlContent: "<html><body><canvas></canvas></body></html>",
        animationType: "shader",
        expectedBehavior: "Smooth color transition",
        criteria: DEFAULT_VALIDATION_CRITERIA,
        createdAt: new Date(),
      };

      const result = await analyzer.analyze(job);

      expect(result.jobId).toBe("test-job-1");
      expect(result.score).toBeDefined();
      expect(result.frameAnalysis).toHaveLength(3);
      expect(result.metadata.framesAnalyzed).toBe(3);
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });

    it("should pass with high score for good animation", async () => {
      const analyzer = new VLMAnimationAnalyzer({ vlmClient: mockVLMClient });
      const job: ValidationJob = {
        id: "test-job-2",
        htmlContent: "<html><body><canvas></canvas></body></html>",
        animationType: "shader",
        expectedBehavior: "Smooth animation",
        criteria: DEFAULT_VALIDATION_CRITERIA,
        createdAt: new Date(),
      };

      const result = await analyzer.analyze(job);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe("Validation Criteria", () => {
    it("should respect temporalConsistency criterion", async () => {
      const analyzer = new VLMAnimationAnalyzer({ vlmClient: mockVLMClient });
      const job: ValidationJob = {
        id: "test-job",
        htmlContent: "<html><body><canvas></canvas></body></html>",
        animationType: "shader",
        expectedBehavior: "Test",
        criteria: {
          ...DEFAULT_VALIDATION_CRITERIA,
          temporalConsistency: false,
        },
        createdAt: new Date(),
      };

      const result = await analyzer.analyze(job);
      
      // Should still analyze but may skip some temporal checks
      expect(result).toBeDefined();
    });

    it("should respect visualQuality criterion", async () => {
      const analyzer = new VLMAnimationAnalyzer({ vlmClient: mockVLMClient });
      const job: ValidationJob = {
        id: "test-job",
        htmlContent: "<html><body><canvas></canvas></body></html>",
        animationType: "shader",
        expectedBehavior: "Test",
        criteria: {
          ...DEFAULT_VALIDATION_CRITERIA,
          visualQuality: false,
        },
        createdAt: new Date(),
      };

      const result = await analyzer.analyze(job);
      expect(result).toBeDefined();
    });

    it("should handle all animation types", async () => {
      const types = ["scroll", "shader", "model", "background", "composite"] as const;
      
      for (const type of types) {
        const analyzer = new VLMAnimationAnalyzer({ vlmClient: mockVLMClient });
        const job: ValidationJob = {
          id: `test-${type}`,
          htmlContent: "<html><body><canvas></canvas></body></html>",
          animationType: type,
          expectedBehavior: "Test",
          criteria: DEFAULT_VALIDATION_CRITERIA,
          createdAt: new Date(),
        };

        const result = await analyzer.analyze(job);
        expect(result).toBeDefined();
        expect(result.jobId).toBe(`test-${type}`);
      }
    });
  });

  describe("Issue Detection", () => {
    it("should detect low quality frames", async () => {
      mockVLMClient.analyzeImage = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          description: "Frame with artifacts",
          quality: 40,
          issues: ["Pixelation detected"],
          dominantColors: [],
          motionDetected: true,
        }),
      });

      const analyzer = new VLMAnimationAnalyzer({ vlmClient: mockVLMClient });
      const job: ValidationJob = {
        id: "test-job",
        htmlContent: "<html><body><canvas></canvas></body></html>",
        animationType: "shader",
        expectedBehavior: "Test",
        criteria: { ...DEFAULT_VALIDATION_CRITERIA, visualQuality: true },
        createdAt: new Date(),
      };

      const result = await analyzer.analyze(job);
      
      const visualQualityIssues = result.issues.filter(
        (i) => i.category === "visualQuality"
      );
      expect(visualQualityIssues.length).toBeGreaterThan(0);
    });

    it("should detect temporal issues", async () => {
      mockVLMClient.analyzeImageSequence = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          temporalIssues: [
            {
              type: "flicker",
              startFrame: 0,
              endFrame: 2,
              severity: "high",
              description: "Screen flickering detected",
            },
          ],
        }),
      });

      const analyzer = new VLMAnimationAnalyzer({ vlmClient: mockVLMClient });
      const job: ValidationJob = {
        id: "test-job",
        htmlContent: "<html><body><canvas></canvas></body></html>",
        animationType: "shader",
        expectedBehavior: "Test",
        criteria: DEFAULT_VALIDATION_CRITERIA,
        createdAt: new Date(),
      };

      const result = await analyzer.analyze(job);
      
      expect(result.temporalIssues).toHaveLength(1);
      expect(result.temporalIssues[0].type).toBe("flicker");
    });
  });

  describe("Score Calculation", () => {
    it("should calculate score based on frame quality and issues", async () => {
      mockVLMClient.analyzeImage = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          description: "Good frame",
          quality: 90,
          issues: [],
          dominantColors: [],
          motionDetected: true,
        }),
      });

      const analyzer = new VLMAnimationAnalyzer({ vlmClient: mockVLMClient });
      const job: ValidationJob = {
        id: "test-job",
        htmlContent: "<html><body><canvas></canvas></body></html>",
        animationType: "shader",
        expectedBehavior: "Test",
        criteria: DEFAULT_VALIDATION_CRITERIA,
        createdAt: new Date(),
      };

      const result = await analyzer.analyze(job);
      
      // With quality 90 and no issues, score should be high
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.passed).toBe(true);
    });

    it("should fail animations with severe issues", async () => {
      mockVLMClient.analyzeImage = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          description: "Poor frame",
          quality: 30,
          issues: ["Heavy artifacts", "Broken shader"],
          dominantColors: [],
          motionDetected: false,
        }),
      });

      mockVLMClient.analyzeImageSequence = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          temporalIssues: [
            {
              type: "flicker",
              startFrame: 0,
              endFrame: 2,
              severity: "high",
              description: "Severe flickering",
            },
          ],
        }),
      });

      const analyzer = new VLMAnimationAnalyzer({ vlmClient: mockVLMClient });
      const job: ValidationJob = {
        id: "test-job",
        htmlContent: "<html><body><canvas></canvas></body></html>",
        animationType: "shader",
        expectedBehavior: "Test",
        criteria: DEFAULT_VALIDATION_CRITERIA,
        createdAt: new Date(),
      };

      const result = await analyzer.analyze(job);
      
      expect(result.score).toBeLessThan(70);
      expect(result.passed).toBe(false);
    });
  });

  describe("Recommendations", () => {
    it("should provide recommendations for scroll animations with motion issues", async () => {
      mockVLMClient.analyzeImageSequence = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          temporalIssues: [
            {
              type: "jitter",
              startFrame: 0,
              endFrame: 1,
              severity: "medium",
              description: "Motion jitter",
            },
          ],
        }),
      });

      const analyzer = new VLMAnimationAnalyzer({ vlmClient: mockVLMClient });
      const job: ValidationJob = {
        id: "test-job",
        htmlContent: "<html><body><canvas></canvas></body></html>",
        animationType: "scroll",
        expectedBehavior: "Test",
        criteria: DEFAULT_VALIDATION_CRITERIA,
        createdAt: new Date(),
      };

      const result = await analyzer.analyze(job);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should provide shader-specific recommendations", async () => {
      mockVLMClient.analyzeImageSequence = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          temporalIssues: [
            {
              type: "flicker",
              startFrame: 0,
              endFrame: 1,
              severity: "medium",
              description: "Shader flicker",
            },
          ],
        }),
      });

      const analyzer = new VLMAnimationAnalyzer({ vlmClient: mockVLMClient });
      const job: ValidationJob = {
        id: "test-job",
        htmlContent: "<html><body><canvas></canvas></body></html>",
        animationType: "shader",
        expectedBehavior: "Test",
        criteria: DEFAULT_VALIDATION_CRITERIA,
        createdAt: new Date(),
      };

      const result = await analyzer.analyze(job);
      
      // Should include anti-aliasing recommendation
      expect(result.recommendations.some(r => r.includes("anti-aliasing"))).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle VLM analysis failures gracefully", async () => {
      mockVLMClient.analyzeImage = vi.fn().mockRejectedValue(new Error("VLM timeout"));

      const analyzer = new VLMAnimationAnalyzer({ vlmClient: mockVLMClient });
      const job: ValidationJob = {
        id: "test-job",
        htmlContent: "<html><body><canvas></canvas></body></html>",
        animationType: "shader",
        expectedBehavior: "Test",
        criteria: DEFAULT_VALIDATION_CRITERIA,
        createdAt: new Date(),
      };

      // Should not throw, but handle errors gracefully
      const result = await analyzer.analyze(job);
      expect(result).toBeDefined();
      expect(result.frameAnalysis.length).toBeGreaterThan(0);
    });
  });
});
