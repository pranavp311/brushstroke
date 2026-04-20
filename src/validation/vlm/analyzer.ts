/**
 * VLM Animation Analyzer
 * 
 * Main orchestrator for animation validation using Vision Language Models
 */

import {
  ValidationJob,
  ValidationResult,
  ValidationCriteria,
  FrameAnalysis,
  TemporalIssue,
  ValidationIssue,
  CaptureConfig,
} from "./types.js";
import { VLMClient } from "./client.js";
import { AnimationCapture } from "./capture.js";

export interface AnalyzerConfig {
  vlmClient?: VLMClient;
  frameInterval?: number;
  parallelFrames?: number;
}

export class VLMAnimationAnalyzer {
  private vlm: VLMClient;
  private capture: AnimationCapture;
  private config: AnalyzerConfig;

  constructor(config: Partial<AnalyzerConfig> = {}) {
    this.vlm = config.vlmClient || new VLMClient();
    this.capture = new AnimationCapture();
    this.config = {
      frameInterval: config.frameInterval ?? 3,
      parallelFrames: config.parallelFrames ?? 4,
    };
  }

  async analyze(job: ValidationJob): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      const captureResult = await this.captureAnimation(job);
      const frameAnalysis = await this.analyzeFrames(
        captureResult.frames,
        job.animationType,
        job.expectedBehavior
      );
      const temporalIssues = await this.analyzeTemporalConsistency(
        captureResult.frames,
        frameAnalysis
      );
      const issues = this.compileIssues(frameAnalysis, temporalIssues, job.criteria);
      const recommendations = this.generateRecommendations(issues, job.animationType);
      const score = this.calculateScore(frameAnalysis, issues, job.criteria);

      return {
        jobId: job.id,
        passed: score >= 70,
        score,
        summary: this.generateSummary(frameAnalysis, issues, score),
        frameAnalysis,
        temporalIssues,
        issues,
        recommendations,
        metadata: {
          framesAnalyzed: frameAnalysis.length,
          duration: captureResult.duration,
          processingTime: Date.now() - startTime,
          modelUsed: "qwen2.5-vl:7b",
        },
      };
    } catch (error) {
      console.error("Validation failed:", error);
      throw error;
    }
  }

  private async captureAnimation(job: ValidationJob) {
    const captureConfig: CaptureConfig = {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 10,
      startDelay: 1000,
      scrollSpeed: undefined,
      interactions: undefined,
    };

    if (job.animationType === "scroll") {
      captureConfig.scrollSpeed = 500;
    } else if (job.animationType === "shader") {
      captureConfig.duration = 5;
    }

    return this.capture.captureFrames(job.htmlContent, captureConfig);
  }

  private async analyzeFrames(
    frames: Buffer[],
    animationType: string,
    expectedBehavior: string
  ): Promise<FrameAnalysis[]> {
    const analysis: FrameAnalysis[] = [];

    const parallelFrames = this.config.parallelFrames ?? 4;
    for (let i = 0; i < frames.length; i += parallelFrames) {
      const batch = frames.slice(i, i + parallelFrames);
      const batchResults = await Promise.all(
        batch.map((frame, idx) =>
          this.analyzeSingleFrame(frame, i + idx, animationType, expectedBehavior)
        )
      );
      analysis.push(...batchResults);
    }

    return analysis;
  }

  private async analyzeSingleFrame(
    frame: Buffer,
    frameNumber: number,
    animationType: string,
    expectedBehavior: string
  ): Promise<FrameAnalysis> {
    const base64 = frame.toString("base64");
    const timestamp = frameNumber * (this.config.frameInterval ?? 3);

    const prompt = `Analyze frame ${frameNumber} of a ${animationType} animation. Expected: ${expectedBehavior}
Respond in JSON: {"description": "...", "quality": 85, "issues": [], "dominantColors": ["#RRGGBB"], "motionDetected": true, "motionDirection": "..."}`;

    try {
      const response = await this.vlm.analyzeImage(base64, prompt);
      const parsed = this.parseJSONResponse(response.content);

      return {
        frameNumber,
        timestamp,
        description: parsed.description || "No description",
        quality: Math.min(100, Math.max(0, parsed.quality || 50)),
        issues: parsed.issues || [],
        dominantColors: parsed.dominantColors || [],
        motionDetected: parsed.motionDetected || false,
        motionDirection: parsed.motionDirection,
      };
    } catch (error) {
      return {
        frameNumber,
        timestamp,
        description: "Analysis failed",
        quality: 50,
        issues: ["Analysis error"],
        dominantColors: [],
        motionDetected: false,
      };
    }
  }

  private async analyzeTemporalConsistency(
    frames: Buffer[],
    _frameAnalysis: FrameAnalysis[]
  ): Promise<TemporalIssue[]> {
    if (frames.length < 3) return [];

    const sampleIndices = [0, Math.floor(frames.length / 2), frames.length - 1];
    const sampleFrames = sampleIndices.map(i => frames[i].toString("base64"));

    const prompt = `Analyze temporal consistency between these 3 frames from an animation. Look for flicker, jitter, jumps, freezes, artifacts.
Respond in JSON: {"temporalIssues": [{"type": "flicker", "startFrame": 0, "endFrame": 2, "severity": "medium", "description": "..."}]}`;

    try {
      const response = await this.vlm.analyzeImageSequence(sampleFrames, prompt);
      const parsed = this.parseJSONResponse(response.content);
      return parsed.temporalIssues || [];
    } catch {
      return [];
    }
  }

  private compileIssues(
    frameAnalysis: FrameAnalysis[],
    temporalIssues: TemporalIssue[],
    criteria: ValidationCriteria
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (criteria.visualQuality) {
      const lowQuality = frameAnalysis.filter(f => f.quality < 60);
      if (lowQuality.length > 0) {
        issues.push({
          category: "visualQuality",
          severity: "warning",
          description: `${lowQuality.length} frames have quality issues`,
          recommendation: "Check shader compilation errors",
          affectedFrames: lowQuality.map(f => f.frameNumber),
        });
      }
    }

    for (const temporal of temporalIssues) {
      issues.push({
        category: "temporalConsistency",
        severity: temporal.severity === "high" ? "error" : "warning",
        description: temporal.description,
        recommendation: this.getTemporalRecommendation(temporal.type),
        affectedFrames: [temporal.startFrame, temporal.endFrame],
      });
    }

    return issues;
  }

  private generateRecommendations(issues: ValidationIssue[], animationType: string): string[] {
    const recommendations: string[] = [];

    if (animationType === "scroll" && issues.some(i => i.category === "motionSmoothness")) {
      recommendations.push("Use spring physics for scroll animations");
    }
    if (animationType === "shader" && issues.some(i => i.category === "temporalConsistency")) {
      recommendations.push("Add temporal anti-aliasing");
    }
    if (issues.some(i => i.category === "visualQuality")) {
      recommendations.push("Enable anti-aliasing");
    }

    return recommendations.length > 0 ? recommendations : ["Animation looks great!"];
  }

  private calculateScore(frameAnalysis: FrameAnalysis[], issues: ValidationIssue[], _criteria: ValidationCriteria): number {
    const avgQuality = frameAnalysis.reduce((sum, f) => sum + f.quality, 0) / frameAnalysis.length;
    const deductions = issues.reduce((sum, i) => sum + (i.severity === "error" ? 15 : i.severity === "warning" ? 8 : 2), 0);
    return Math.max(0, Math.min(100, avgQuality - deductions));
  }

  private generateSummary(frameAnalysis: FrameAnalysis[], issues: ValidationIssue[], score: number): string {
    const avgQuality = frameAnalysis.reduce((sum, f) => sum + f.quality, 0) / frameAnalysis.length;
    let summary = `Quality: ${avgQuality.toFixed(1)}/100. `;
    summary += score >= 90 ? "Excellent!" : score >= 70 ? "Good quality." : score >= 50 ? "Fair quality." : "Poor quality.";
    const errors = issues.filter(i => i.severity === "error").length;
    if (errors > 0) summary += ` ${errors} errors found.`;
    return summary;
  }

  private parseJSONResponse(content: string): any {
    try {
      const match = content.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : {};
    } catch {
      return {};
    }
  }

  private getTemporalRecommendation(type: string): string {
    const recs: Record<string, string> = {
      flicker: "Add temporal anti-aliasing",
      jitter: "Use spring physics",
      jump: "Check keyframe continuity",
      freeze: "Verify animation loop",
      artifact: "Check shader precision",
    };
    return recs[type] || "Review animation timing";
  }
}
