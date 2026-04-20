/**
 * VLM Client Tests
 * Tests for multiple provider support and API integrations
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { VLMClient } from "../../src/validation/vlm/client.js";
import { VLMConfig } from "../../src/validation/vlm/types.js";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("VLMClient", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("Provider Support", () => {
    it("should default to Ollama provider", () => {
      const client = new VLMClient();
      expect(client).toBeDefined();
    });

    it("should accept Ollama configuration", () => {
      const config: VLMConfig = {
        provider: "ollama",
        model: "qwen2.5-vl:7b",
        baseUrl: "http://localhost:11434",
        maxTokens: 4096,
        temperature: 0.2,
      };
      const client = new VLMClient(config);
      expect(client).toBeDefined();
    });

    it("should accept Together AI configuration", () => {
      const config: VLMConfig = {
        provider: "together",
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
        apiKey: "test-api-key",
        maxTokens: 4096,
        temperature: 0.2,
      };
      const client = new VLMClient(config);
      expect(client).toBeDefined();
    });

    it("should accept Fireworks configuration", () => {
      const config: VLMConfig = {
        provider: "fireworks",
        model: "accounts/fireworks/models/llama-v3p2-11b-vision-instruct",
        apiKey: "test-api-key",
        maxTokens: 4096,
        temperature: 0.2,
      };
      const client = new VLMClient(config);
      expect(client).toBeDefined();
    });

    it("should accept OpenAI configuration", () => {
      const config: VLMConfig = {
        provider: "openai",
        model: "gpt-4o",
        apiKey: "test-api-key",
        maxTokens: 4096,
        temperature: 0.2,
      };
      const client = new VLMClient(config);
      expect(client).toBeDefined();
    });
  });

  describe("Ollama Provider", () => {
    it("should call Ollama API correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: '{"quality": 85}',
          prompt_eval_count: 100,
          eval_count: 50,
        }),
      });

      const client = new VLMClient({
        provider: "ollama",
        model: "qwen2.5-vl:7b",
        baseUrl: "http://localhost:11434",
      });

      const result = await client.analyzeImage("base64image", "Analyze this frame");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:11434/api/generate",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("qwen2.5-vl:7b"),
        })
      );
      expect(result.content).toBe('{"quality": 85}');
      expect(result.usage).toEqual({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      });
    });

    it("should handle Ollama API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Connection refused",
      });

      const client = new VLMClient({
        provider: "ollama",
        model: "qwen2.5-vl:7b",
      });

      await expect(client.analyzeImage("base64image", "test")).rejects.toThrow(
        "Ollama API error: Connection refused"
      );
    });
  });

  describe("Together AI Provider", () => {
    it("should call Together API correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"quality": 90}' } }],
          usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        }),
      });

      const client = new VLMClient({
        provider: "together",
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
        apiKey: "test-key",
      });

      const result = await client.analyzeImage("base64image", "Analyze this");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.together.xyz/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Authorization": "Bearer test-key",
          }),
        })
      );
      expect(result.content).toBe('{"quality": 90}');
    });

    it("should handle Together API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Unauthorized",
      });

      const client = new VLMClient({
        provider: "together",
        model: "test-model",
        apiKey: "invalid-key",
      });

      await expect(client.analyzeImage("base64", "test")).rejects.toThrow(
        "Together API error: Unauthorized"
      );
    });
  });

  describe("Fireworks Provider", () => {
    it("should call Fireworks API correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"quality": 88}' } }],
          usage: { promptTokens: 100, completionTokens: 40, totalTokens: 140 },
        }),
      });

      const client = new VLMClient({
        provider: "fireworks",
        model: "accounts/fireworks/models/llama-v3p2-11b-vision-instruct",
        apiKey: "test-key",
      });

      const result = await client.analyzeImage("base64image", "Analyze");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.fireworks.ai/inference/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Authorization": "Bearer test-key",
          }),
        })
      );
      expect(result.content).toBe('{"quality": 88}');
    });
  });

  describe("OpenAI Provider", () => {
    it("should call OpenAI API correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"quality": 95}' } }],
          usage: { promptTokens: 100, completionTokens: 30, totalTokens: 130 },
        }),
      });

      const client = new VLMClient({
        provider: "openai",
        model: "gpt-4o",
        apiKey: "test-key",
      });

      const result = await client.analyzeImage("base64image", "Analyze");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Authorization": "Bearer test-key",
          }),
        })
      );
      expect(result.content).toBe('{"quality": 95}');
    });
  });

  describe("Image Sequence Analysis", () => {
    it("should analyze frames in batches", async () => {
      // Ollama analyzes each frame individually (5 frames) + 1 synthesis = 6 calls
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ response: "Frame 1" }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ response: "Frame 2" }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ response: "Frame 3" }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ response: "Frame 4" }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ response: "Frame 5" }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ response: "Final synthesis" }) });

      const client = new VLMClient({
        provider: "ollama",
        model: "qwen2.5-vl:7b",
      });

      const frames = ["frame1", "frame2", "frame3", "frame4", "frame5"];
      const result = await client.analyzeImageSequence(frames, "Analyze sequence");

      expect(mockFetch).toHaveBeenCalledTimes(6);  // 5 frames + 1 synthesis
      expect(result.content).toContain("Final synthesis");
    });
  });

  describe("Error Handling", () => {
    it("should throw error for unknown provider", async () => {
      const client = new VLMClient({
        provider: "unknown" as any,
        model: "test",
      });

      await expect(client.analyzeImage("base64", "test")).rejects.toThrow(
        "Unknown provider: unknown"
      );
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const client = new VLMClient({
        provider: "ollama",
        model: "qwen2.5-vl:7b",
      });

      await expect(client.analyzeImage("base64", "test")).rejects.toThrow("Network error");
    });
  });
});
