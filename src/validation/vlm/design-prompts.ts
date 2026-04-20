/**
 * VLM Prompt Templates for Design Evaluation
 *
 * Generates structured prompts that guide the VLM to evaluate visual design
 * quality against a user's creative brief and suggest parameter-level fixes
 * within brushstroke's capability space.
 */

import { PARAMETER_SPACE_DOCS } from "../../resources/content/parameter-space.js";

export function buildDesignEvaluationPrompt(params: {
  designBrief: string;
  currentParams?: string;
  iterationNumber: number;
  previousScore?: number;
}): string {
  const iterationContext = params.previousScore != null
    ? `This is iteration ${params.iterationNumber}. Previous score: ${params.previousScore}/100. Focus on what improved and what still needs work.`
    : `This is the first iteration.`;

  return `You are an expert web designer and art director evaluating a generated web page.

## User's Design Brief
${params.designBrief}

## Current Parameters
${params.currentParams ?? "Not provided"}

${PARAMETER_SPACE_DOCS}

## Evaluation Task
${iterationContext}

You are shown screenshots of the generated page at different scroll positions. Evaluate the design quality against the user's brief.

Score each category 0-100:
1. **aestheticMatch**: Does the visual design match the mood, style, and intent described in the brief?
2. **colorHarmony**: Are colors harmonious, on-brand, with sufficient contrast for readability?
3. **typography**: Is the typography modern, appropriately sized, with clear hierarchy?
4. **layout**: Is the layout balanced with clear visual hierarchy and appropriate spacing?
5. **threeDIntegration**: Does the 3D element complement the page naturally (not feel pasted on)?
6. **distinctiveness**: Does this look like a custom design, not a generic template?
7. **technicalQuality**: Are there rendering artifacts, clipping, or visual glitches?

For each issue found, suggest a specific fix using the parameter paths listed above.

Respond ONLY with valid JSON matching this schema:
{
  "overallScore": <number 0-100>,
  "categories": {
    "aestheticMatch": <number>,
    "colorHarmony": <number>,
    "typography": <number>,
    "layout": <number>,
    "threeDIntegration": <number>,
    "distinctiveness": <number>,
    "technicalQuality": <number>
  },
  "issues": [
    {
      "category": "<category name>",
      "severity": "critical" | "major" | "minor",
      "description": "<what's wrong>",
      "suggestedFix": {
        "paramPath": "<e.g. designTokens.colors.primary>",
        "currentValue": "<current value or 'unknown'>",
        "suggestedValue": "<specific value like #1a2b3c or 0.8>",
        "reasoning": "<why this change helps>"
      }
    }
  ],
  "summary": "<2-3 sentence overall assessment>",
  "shouldContinue": <boolean - true if score < 85 or critical issues remain>,
  "improvementFromPrevious": <number or null if first iteration>
}`;
}
