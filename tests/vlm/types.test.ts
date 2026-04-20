/**
 * VLM Types Tests
 * Tests for type definitions and constants
 */

import { describe, it, expect } from "vitest";
import {
  AnimationType,
  ValidationCriteria,
  DEFAULT_VALIDATION_CRITERIA,
  DEFAULT_VLM_CONFIG,
  VLM_MODELS,
  CaptureConfig,
  Interaction,
} from "../../src/validation/vlm/types.js";

describe("VLM Types", () => {
  describe("AnimationType", () => {
    it("should have all animation types defined", () => {
      const types: AnimationType[] = ["scroll", "shader", "model", "background", "composite"];
      expect(types).toContain("scroll");
      expect(types).toContain("shader");
      expect(types).toContain("model");
      expect(types).toContain("background");
      expect(types).toContain("composite");
    });
  });

  describe("ValidationCriteria", () => {
    it("should have all criteria enabled by default", () => {
      expect(DEFAULT_VALIDATION_CRITERIA.temporalConsistency).toBe(true);
      expect(DEFAULT_VALIDATION_CRITERIA.motionSmoothness).toBe(true);
      expect(DEFAULT_VALIDATION_CRITERIA.visualQuality).toBe(true);
      expect(DEFAULT_VALIDATION_CRITERIA.colorHarmony).toBe(true);
      expect(DEFAULT_VALIDATION_CRITERIA.timingAppropriate).toBe(true);
      expect(DEFAULT_VALIDATION_CRITERIA.behaviorMatch).toBe(true);
    });

    it("should allow partial criteria override", () => {
      const partialCriteria: Partial<ValidationCriteria> = {
        temporalConsistency: false,
        visualQuality: false,
      };
      const merged = { ...DEFAULT_VALIDATION_CRITERIA, ...partialCriteria };
      expect(merged.temporalConsistency).toBe(false);
      expect(merged.visualQuality).toBe(false);
      expect(merged.motionSmoothness).toBe(true); // unchanged
    });
  });

  describe("VLMConfig", () => {
    it("should have sensible defaults", () => {
      expect(DEFAULT_VLM_CONFIG.provider).toBe("ollama");
      expect(DEFAULT_VLM_CONFIG.model).toBe("qwen2.5-vl:7b");
      expect(DEFAULT_VLM_CONFIG.baseUrl).toBe("http://localhost:11434");
      expect(DEFAULT_VLM_CONFIG.maxTokens).toBe(4096);
      expect(DEFAULT_VLM_CONFIG.temperature).toBe(0.2);
    });

    it("should support all providers", () => {
      const providers = ["ollama", "openai", "anthropic", "together", "fireworks"] as const;
      providers.forEach((provider) => {
        const config = { ...DEFAULT_VLM_CONFIG, provider };
        expect(config.provider).toBe(provider);
      });
    });
  });

  describe("VLM_MODELS", () => {
    it("should define Qwen models with correct specs", () => {
      expect(VLM_MODELS.qwen["qwen2.5-vl:3b"]).toEqual({
        size: "3B",
        vram: "6GB",
        speed: "fast",
        quality: "good",
      });
      expect(VLM_MODELS.qwen["qwen2.5-vl:7b"]).toEqual({
        size: "7B",
        vram: "10GB",
        speed: "medium",
        quality: "very good",
      });
      expect(VLM_MODELS.qwen["qwen2.5-vl:32b"]).toEqual({
        size: "32B",
        vram: "40GB",
        speed: "slow",
        quality: "excellent",
      });
    });

    it("should define Pixtral model", () => {
      expect(VLM_MODELS.pixtral["pixtral:12b"]).toEqual({
        size: "12B",
        vram: "16GB",
        speed: "medium",
        quality: "very good",
      });
    });

    it("should define Janus model", () => {
      expect(VLM_MODELS.janus["janus-pro:7b"]).toEqual({
        size: "7B",
        vram: "10GB",
        speed: "medium",
        quality: "good",
      });
    });
  });

  describe("CaptureConfig", () => {
    it("should support all capture options", () => {
      const config: CaptureConfig = {
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 10,
        scrollSpeed: 500,
        startDelay: 1000,
        interactions: [
          {
            type: "scroll",
            delay: 1000,
            params: { x: 0, y: 500 },
          },
          {
            type: "click",
            delay: 2000,
            params: { selector: "#button" },
          },
          {
            type: "mousemove",
            delay: 3000,
            params: { mx: 100, my: 200 },
          },
          {
            type: "hover",
            delay: 4000,
            params: { hoverSelector: ".tooltip" },
          },
          {
            type: "wait",
            delay: 5000,
            params: { ms: 2000 },
          },
        ],
      };

      expect(config.width).toBe(1920);
      expect(config.interactions).toHaveLength(5);
      expect(config.interactions?.[0].type).toBe("scroll");
    });
  });
});
