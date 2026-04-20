/**
 * Structured feedback types for machine-parseable tool results.
 * Every tool returns a __BRUSHSTROKE_FEEDBACK__ block with this shape.
 */

export interface ParameterWarning {
  /** Machine-readable code, e.g. "WCAG_CONTRAST_FAIL", "MISSING_RESIZE_HANDLER" */
  code: string;
  /** Human-readable description */
  message: string;
  /** Severity level */
  severity: "critical" | "major" | "minor";
  /** Matches a quality breakdown key */
  category: string;
}

export interface ParameterFix {
  /** Dot-notation path into tool params, e.g. "designTokens.colors.primary" */
  paramPath: string;
  /** Current value (if known) */
  currentValue: unknown;
  /** Recommended replacement value */
  suggestedValue: unknown;
  /** Why this fix helps */
  reasoning: string;
  /** Expected impact on quality score */
  impact: "high" | "medium" | "low";
}

export interface StructuredFeedback {
  quality: {
    /** Overall quality score 0-100 */
    overall: number;
    /** Per-category scores */
    breakdown: Record<string, number>;
    /** True if overall >= 70 */
    pass: boolean;
  };
  /** Structured warnings with codes and severities */
  warnings: ParameterWarning[];
  /** Actionable parameter-level fix suggestions */
  suggestions: ParameterFix[];
  /** Resolved parameters (for generate_page) */
  resolvedParams?: Record<string, unknown>;
  /** Human-readable quality report (backward compat) */
  humanReadable?: string;
  metadata: {
    /** Tool name that generated this feedback */
    tool: string;
    /** Output format of the generated code */
    outputFormat: string;
  };
}

/** Prefix marker for machine-parseable feedback blocks */
export const FEEDBACK_PREFIX = "__BRUSHSTROKE_FEEDBACK__";
