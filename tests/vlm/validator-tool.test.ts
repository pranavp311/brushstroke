/**
 * Animation Validator Tool Tests
 * Tests for MCP tool integration (validate_animation, quick_validate)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAnimationValidator } from "../../src/tools/animation-validator.js";

// Mock the analyzer module
vi.mock("../../src/validation/vlm/analyzer.js", () => ({
  VLMAnimationAnalyzer: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue({
      jobId: "test-job",
      passed: true,
      score: 85,
      summary: "Quality: 85.0/100. Good quality.",
      frameAnalysis: [
        { frameNumber: 1, timestamp: 0, quality: 85, issues: [] },
        { frameNumber: 2, timestamp: 3, quality: 86, issues: [] },
      ],
      temporalIssues: [],
      issues: [],
      recommendations: ["Animation looks great!"],
      metadata: {
        framesAnalyzed: 2,
        duration: 6,
        processingTime: 1000,
        modelUsed: "qwen2.5-vl:7b",
      },
    }),
  })),
}));

describe("Animation Validator Tool", () => {
  let server: McpServer;
  let registeredTools: Map<string, any>;

  beforeEach(() => {
    registeredTools = new Map();
    server = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredTools.set(name, { description, schema, handler });
      }),
    } as unknown as McpServer;
    
    registerAnimationValidator(server);
  });

  describe("Tool Registration", () => {
    it("should register validate_animation tool", () => {
      expect(registeredTools.has("validate_animation")).toBe(true);
    });

    it("should register quick_validate tool", () => {
      expect(registeredTools.has("quick_validate")).toBe(true);
    });

    it("should have correct descriptions", () => {
      const validateTool = registeredTools.get("validate_animation");
      const quickTool = registeredTools.get("quick_validate");
      
      expect(validateTool.description).toContain("AI-powered VLM analysis");
      expect(quickTool.description).toContain("Quick animation validation");
    });
  });

  describe("validate_animation tool", () => {
    it("should validate with default parameters", async () => {
      const tool = registeredTools.get("validate_animation");
      const result = await tool.handler({
        htmlContent: "<html><body>Test</body></html>",
        animationType: "shader",
        expectedBehavior: "Smooth animation",
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain("PASSED");
      expect(result.content[0].text).toContain("85/100");
    });

    it("should support all animation types", async () => {
      const tool = registeredTools.get("validate_animation");
      const types = ["scroll", "shader", "model", "background", "composite"];
      
      for (const type of types) {
        const result = await tool.handler({
          htmlContent: "<html><body>Test</body></html>",
          animationType: type,
          expectedBehavior: "Test",
        });
        expect(result.content).toBeDefined();
        expect(result.isError).toBeFalsy();
      }
    });

    it("should support all VLM providers", async () => {
      const tool = registeredTools.get("validate_animation");
      const providers = ["ollama", "together", "fireworks", "openai"];
      
      for (const provider of providers) {
        const result = await tool.handler({
          htmlContent: "<html><body>Test</body></html>",
          animationType: "shader",
          expectedBehavior: "Test",
          vlmProvider: provider,
          vlmApiKey: provider !== "ollama" ? "test-key" : undefined,
        });
        expect(result.content).toBeDefined();
      }
    });

    it("should handle validation errors gracefully", async () => {
      const tool = registeredTools.get("validate_animation");
      
      // Override the mock for this test
      const { VLMAnimationAnalyzer } = await import("../../src/validation/vlm/analyzer.js");
      vi.mocked(VLMAnimationAnalyzer).mockImplementationOnce(() => ({
        analyze: vi.fn().mockRejectedValue(new Error("Puppeteer not installed")),
      } as any));

      const result = await tool.handler({
        htmlContent: "<html><body>Test</body></html>",
        animationType: "shader",
        expectedBehavior: "Test",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Validation Error");
    });

    it("should respect toggle flags for criteria", async () => {
      const tool = registeredTools.get("validate_animation");
      const result = await tool.handler({
        htmlContent: "<html><body>Test</body></html>",
        animationType: "shader",
        expectedBehavior: "Test",
        checkTemporalConsistency: false,
        checkMotionSmoothness: false,
        checkVisualQuality: false,
        checkColorHarmony: false,
      });

      expect(result.content).toBeDefined();
      expect(result.isError).toBeFalsy();
    });

    it("should use custom VLM model", async () => {
      const tool = registeredTools.get("validate_animation");
      const result = await tool.handler({
        htmlContent: "<html><body>Test</body></html>",
        animationType: "shader",
        expectedBehavior: "Test",
        vlmProvider: "together",
        vlmModel: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
        vlmApiKey: "test-api-key",
      });

      expect(result.content).toBeDefined();
    });
  });

  describe("quick_validate tool", () => {
    it("should validate with minimal parameters", async () => {
      const tool = registeredTools.get("quick_validate");
      const result = await tool.handler({
        htmlContent: "<html><body>Test</body></html>",
        animationType: "shader",
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain("Score:");
      expect(result.content[0].text).toContain("PASSED");
    });

    it("should handle all animation types", async () => {
      const tool = registeredTools.get("quick_validate");
      const types = ["scroll", "shader", "model", "background"];
      
      for (const type of types) {
        const result = await tool.handler({
          htmlContent: "<html><body>Test</body></html>",
          animationType: type,
        });
        expect(result.content).toBeDefined();
      }
    });

    it("should handle validation errors", async () => {
      const tool = registeredTools.get("quick_validate");
      
      const { VLMAnimationAnalyzer } = await import("../../src/validation/vlm/analyzer.js");
      vi.mocked(VLMAnimationAnalyzer).mockImplementationOnce(() => ({
        analyze: vi.fn().mockRejectedValue(new Error("Capture failed")),
      } as any));

      const result = await tool.handler({
        htmlContent: "<html><body>Test</body></html>",
        animationType: "shader",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error:");
    });
  });
});
