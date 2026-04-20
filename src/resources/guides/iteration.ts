export const ITERATION_GUIDE = `# Iteration Workflow Guide

## Step-by-Step Feedback Loop

### Step 1: Generate
Call \`generate_page\` with your page specification. Include \`preview: true\` for visual feedback.

### Step 2: Parse Feedback
The second-to-last content block contains structured feedback:
\`\`\`
__BRUSHSTROKE_FEEDBACK__
{"quality":{"overall":72,"breakdown":{...},"pass":true},"warnings":[...],"suggestions":[...]}
\`\`\`

### Step 3: Evaluate
- \`quality.overall >= 85\` — ship it
- \`quality.overall >= 70\` — acceptable, but could improve
- \`quality.overall < 70\` — needs fixes before shipping

### Step 4: Apply Fixes
Each \`suggestions[]\` entry has:
- \`paramPath\`: dot-notation path into generate_page params (e.g., "designTokens.colors.text")
- \`suggestedValue\`: the recommended value
- \`reasoning\`: why this helps
- \`impact\`: "high" | "medium" | "low"

Apply high-impact fixes first. Update your params and re-call \`generate_page\`.

### Step 5: Converge
Stop when:
- \`quality.overall >= 85\`
- 3 iterations completed (diminishing returns after this)
- All "critical" and "major" warnings resolved

## Using \`preview: true\` vs Manual Capture + Evaluate

| Approach | Latency | Visual | VLM Eval |
|----------|---------|--------|----------|
| \`preview: false\` (default) | Fast | No | No |
| \`preview: true\` | +5s | 3 screenshots | No |
| \`preview: true\` + \`previewBrief\` | +13s | 3 screenshots | Yes |
| Manual: capture + evaluate | +10s | Configurable | Full control |

Use \`preview: true\` for the common case. Use manual capture + evaluate when you need:
- Custom scroll positions
- Multiple viewports (mobile, tablet, desktop)
- Detailed VLM configuration (provider, model selection)

## Using \`iterate_page\`

For automated iteration, use the \`iterate_page\` tool:
\`\`\`json
{
  "currentParams": "{ ... generate_page params as JSON ... }",
  "feedback": "{ ... __BRUSHSTROKE_FEEDBACK__ JSON ... }",
  "maxIterations": 3,
  "targetScore": 85
}
\`\`\`

It will automatically:
1. Parse the feedback
2. Apply high-impact fixes
3. Regenerate the page
4. Repeat until target score reached or max iterations hit
`;
