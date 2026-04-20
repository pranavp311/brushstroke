import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { VLMAnimationAnalyzer } from "../validation/vlm/analyzer.js";
import { VLMClient } from "../validation/vlm/client.js";
import { ValidationCriteria, AnimationType, VLMConfig } from "../validation/vlm/types.js";

export function registerAnimationValidator(server: McpServer): void {
  server.tool(
    "validate_animation",
    "Validate generated animations using AI-powered VLM analysis. Captures frames and analyzes visual quality, temporal consistency, and motion smoothness.",
    {
      htmlContent: z.string().describe("The HTML content containing the animation to validate"),
      animationType: z.enum(["scroll", "shader", "model", "background", "composite"]).describe("Type of animation"),
      expectedBehavior: z.string().describe("Description of expected animation behavior"),
      captureDuration: z.number().min(3).max(30).default(10).describe("Duration to capture in seconds"),
      captureFps: z.number().min(1).max(60).default(30).describe("Capture frame rate"),
      vlmProvider: z.enum(["ollama", "together", "fireworks", "openai"]).default("ollama").describe("VLM provider"),
      vlmModel: z.string().default("qwen2.5-vl:7b").describe("VLM model name"),
      vlmApiKey: z.string().optional().describe("API key for cloud providers"),
      checkTemporalConsistency: z.boolean().default(true).describe("Check for flickering/jitter"),
      checkMotionSmoothness: z.boolean().default(true).describe("Check motion quality"),
      checkVisualQuality: z.boolean().default(true).describe("Check for artifacts"),
      checkColorHarmony: z.boolean().default(true).describe("Check color consistency"),
    },
    async (params) => {
      try {
        // Setup VLM client
        const vlmConfig: VLMConfig = {
          provider: params.vlmProvider,
          model: params.vlmModel,
          apiKey: params.vlmApiKey,
          baseUrl: params.vlmProvider === "ollama" ? "http://localhost:11434" : undefined,
          maxTokens: 4096,
          temperature: 0.2,
        };

        const vlmClient = new VLMClient(vlmConfig);
        const analyzer = new VLMAnimationAnalyzer({ vlmClient });

        // Build criteria
        const criteria: ValidationCriteria = {
          temporalConsistency: params.checkTemporalConsistency,
          motionSmoothness: params.checkMotionSmoothness,
          visualQuality: params.checkVisualQuality,
          colorHarmony: params.checkColorHarmony,
          timingAppropriate: true,
          behaviorMatch: true,
        };

        // Create validation job
        const job = {
          id: `val-${Date.now()}`,
          htmlContent: params.htmlContent,
          animationType: params.animationType as AnimationType,
          expectedBehavior: params.expectedBehavior,
          criteria,
          createdAt: new Date(),
        };

        // Run analysis
        const result = await analyzer.analyze(job);

        // Format report
        const report = formatValidationReport(result);

        return {
          content: [
            { type: "text" as const, text: report },
            { type: "text" as const, text: `\n\nScore: ${result.score}/100` },
          ],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Validation Error: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Quick validation preset
  server.tool(
    "quick_validate",
    "Quick animation validation with default settings",
    {
      htmlContent: z.string(),
      animationType: z.enum(["scroll", "shader", "model", "background"]),
    },
    async (params) => {
      try {
        const analyzer = new VLMAnimationAnalyzer();
        const result = await analyzer.analyze({
          id: `quick-${Date.now()}`,
          htmlContent: params.htmlContent,
          animationType: params.animationType as AnimationType,
          expectedBehavior: "Smooth, artifact-free animation",
          criteria: {
            temporalConsistency: true,
            motionSmoothness: true,
            visualQuality: true,
            colorHarmony: false,
            timingAppropriate: true,
            behaviorMatch: true,
          },
          createdAt: new Date(),
        });

        return {
          content: [{
            type: "text" as const,
            text: `Score: ${result.score}/100 - ${result.passed ? "PASSED" : "FAILED"}\n${result.summary}`
          }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}

function formatValidationReport(result: {
  passed: boolean;
  score: number;
  summary: string;
  frameAnalysis: Array<{
    frameNumber: number;
    timestamp: number;
    quality: number;
    issues: string[];
  }>;
  issues: Array<{
    category: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
  recommendations: string[];
  metadata: {
    framesAnalyzed: number;
    processingTime: number;
  };
}): string {
  const lines: string[] = [
    "# Animation Validation Report",
    "",
    `## Summary: ${result.passed ? "✅ PASSED" : "❌ FAILED"}`,
    `**Score:** ${result.score}/100`,
    `**Summary:** ${result.summary}`,
    `**Frames Analyzed:** ${result.metadata.framesAnalyzed}`,
    `**Processing Time:** ${result.metadata.processingTime}ms`,
    "",
    "## Frame Analysis",
  ];

  for (const frame of result.frameAnalysis) {
    lines.push(`- Frame ${frame.frameNumber} (${frame.timestamp}s): ${frame.quality}/100`);
    if (frame.issues.length > 0) {
      lines.push(`  - Issues: ${frame.issues.join(", ")}`);
    }
  }

  if (result.issues.length > 0) {
    lines.push("", "## Issues Found");
    for (const issue of result.issues) {
      lines.push(`- **[${issue.severity.toUpperCase()}]** ${issue.category}: ${issue.description}`);
      lines.push(`  - Recommendation: ${issue.recommendation}`);
    }
  }

  if (result.recommendations.length > 0) {
    lines.push("", "## Recommendations");
    for (const rec of result.recommendations) {
      lines.push(`- ${rec}`);
    }
  }

  return lines.join("\n");
}
