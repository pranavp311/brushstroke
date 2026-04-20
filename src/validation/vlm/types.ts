/**
 * VLM-Based Animation Validation Types
 * 
 * Defines the interfaces for automated animation quality assessment
 * using Vision Language Models.
 */

export type AnimationType = "scroll" | "shader" | "model" | "background" | "composite";

export interface ValidationCriteria {
  /** Check for flickering, jitter, or frame drops */
  temporalConsistency: boolean;
  /** Check for smooth, natural motion */
  motionSmoothness: boolean;
  /** Check for visual artifacts, glitches */
  visualQuality: boolean;
  /** Check for color consistency and harmony */
  colorHarmony: boolean;
  /** Check for appropriate animation timing */
  timingAppropriate: boolean;
  /** Check if animation matches expected behavior */
  behaviorMatch: boolean;
}

export const DEFAULT_VALIDATION_CRITERIA: ValidationCriteria = {
  temporalConsistency: true,
  motionSmoothness: true,
  visualQuality: true,
  colorHarmony: true,
  timingAppropriate: true,
  behaviorMatch: true,
};

export interface ValidationJob {
  id: string;
  htmlContent: string;
  animationType: AnimationType;
  expectedBehavior: string;
  criteria: ValidationCriteria;
  createdAt: Date;
}

export interface FrameAnalysis {
  frameNumber: number;
  timestamp: number; // seconds
  description: string;
  quality: number; // 0-100
  issues: string[];
  dominantColors: string[];
  motionDetected: boolean;
  motionDirection?: string;
}

export interface TemporalIssue {
  type: "flicker" | "jitter" | "jump" | "freeze" | "artifact";
  startFrame: number;
  endFrame: number;
  severity: "low" | "medium" | "high";
  description: string;
}

export interface ValidationIssue {
  category: keyof ValidationCriteria;
  severity: "info" | "warning" | "error";
  description: string;
  recommendation: string;
  affectedFrames?: number[];
}

export interface ValidationResult {
  jobId: string;
  passed: boolean;
  score: number; // 0-100
  summary: string;
  frameAnalysis: FrameAnalysis[];
  temporalIssues: TemporalIssue[];
  issues: ValidationIssue[];
  recommendations: string[];
  metadata: {
    framesAnalyzed: number;
    duration: number; // seconds
    processingTime: number; // ms
    modelUsed: string;
  };
}

export interface CaptureConfig {
  width: number;
  height: number;
  fps: number;
  duration: number;
  scrollSpeed?: number; // pixels per second for scroll animations
  interactions?: Interaction[];
  startDelay?: number; // ms to wait before capture
}

export interface Interaction {
  type: "scroll" | "click" | "mousemove" | "hover" | "wait";
  delay: number; // ms from start
  params: Record<string, unknown>;
}

export interface VLMConfig {
  provider: "ollama" | "openai" | "anthropic" | "together" | "fireworks";
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export const DEFAULT_VLM_CONFIG: VLMConfig = {
  provider: "ollama",
  model: "qwen2.5-vl:7b",
  baseUrl: "http://localhost:11434",
  maxTokens: 4096,
  temperature: 0.2,
};

export interface DesignEvaluationResult {
  overallScore: number;
  categories: Record<string, number>;
  issues: DesignIssue[];
  summary: string;
  shouldContinue: boolean;
  improvementFromPrevious: number | null;
}

export interface DesignIssue {
  category: string;
  severity: "critical" | "major" | "minor";
  description: string;
  suggestedFix: {
    paramPath: string;
    currentValue: string;
    suggestedValue: string;
    reasoning: string;
  };
}

export const VLM_MODELS = {
  qwen: {
    "qwen2.5-vl:3b": { size: "3B", vram: "6GB", speed: "fast", quality: "good" },
    "qwen2.5-vl:7b": { size: "7B", vram: "10GB", speed: "medium", quality: "very good" },
    "qwen2.5-vl:32b": { size: "32B", vram: "40GB", speed: "slow", quality: "excellent" },
  },
  pixtral: {
    "pixtral:12b": { size: "12B", vram: "16GB", speed: "medium", quality: "very good" },
  },
  janus: {
    "janus-pro:7b": { size: "7B", vram: "10GB", speed: "medium", quality: "good" },
  },
};
