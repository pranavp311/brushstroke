export const COMPOSITION_GUIDE = `# Tool Composition Guide

## Tool Dependency Graph

\`generate_page\` orchestrates these tools internally:
- \`generate_background\` — background preset rendering
- \`generate_3d_model\` — procedural model generation
- \`generate_scroll_animation\` — scroll keyframe system
- \`generate_component\` — section content rendering

## When to Use \`generate_page\` vs Individual Tools

### Use \`generate_page\` when:
- Building a complete landing page with 3D elements
- You want consistent design tokens across all sections
- You need a single WebGL renderer (avoids context conflicts)
- You want automatic quality scoring and feedback

### Use individual tools when:
- Prototyping a single shader effect (\`generate_shader\`)
- Creating a standalone background scene (\`generate_background\`)
- Building a reusable component (\`generate_component\`)
- Creating a composable Three.js module (\`generate_scene\`)
- Converting media to ASCII art (\`generate_ascii_art\`)

## The Generate -> Preview -> Iterate Loop

1. Call \`generate_page\` with \`preview: true\` for visual feedback
2. Parse the \`__BRUSHSTROKE_FEEDBACK__\` JSON from the response
3. Check \`quality.overall\` — if < 85, apply \`suggestions[]\` fixes
4. Each suggestion has \`paramPath\` (e.g. "designTokens.colors.primary") and \`suggestedValue\`
5. Re-call \`generate_page\` with the fixed parameters
6. Stop at score >= 85 or after 3 iterations

## \`generate_scene\` vs \`generate_page\`

| Feature | generate_scene | generate_page |
|---------|---------------|---------------|
| Output | Module JS | Full HTML |
| Renderer | Manual setup | Auto-managed |
| Sections | None | Multi-section |
| Design tokens | Optional | Automatic |
| Quality scoring | Basic | Full static analysis |
| Use case | Custom 3D embed | Complete page |

## Combining Shaders

- \`generate_shader\` — single effect
- \`generate_shader_stack\` — multi-layer with blend modes (up to 5 layers)
- \`generate_simple_composite\` — quick two-shader combination
`;
