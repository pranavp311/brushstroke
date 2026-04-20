/**
 * Bit-packed character sets for ASCII rendering.
 * Each integer encodes a 5x5 pixel grid for a character glyph.
 * Characters are selected based on luminance (fill) or edge direction (edge).
 */

/** 10 fill characters from dark to bright (space → full block) */
export const FILL_CHARS = [
  4096,       // level 0: near-empty (space with single dot)
  4329476,    // level 1: . (period)
  65600,      // level 2: : (colon)
  163153,     // level 3: - (dash)
  15255086,   // level 4: = (equals)
  13121101,   // level 5: + (plus)
  15252014,   // level 6: * (asterisk)
  11512810,   // level 7: # (hash)
  32012382,   // level 8: @ (at)
  33061950,   // level 9: full block
] as const;

/** 5 edge direction characters */
export const EDGE_CHARS = {
  horizontal: 4329604,   // — (em dash)
  vertical: 4541220,     // | (pipe)
  forwardSlash: 1131796, // / (forward slash)
  backslash: 4460068,    // \ (backslash)
  cross: 4735540,        // + (cross for intersections)
} as const;

/** Generate GLSL code for fill character selection (10 levels) */
export function fillCharGlsl(): string {
  return FILL_CHARS.map((val, i) => {
    const threshold = (i / FILL_CHARS.length).toFixed(2);
    return i === 0
      ? `int n = ${val};`
      : `if (lum > ${threshold}) n = ${val};`;
  }).join("\n  ");
}

/** Generate GLSL code for edge character selection (5 directions) */
export function edgeCharGlsl(edgeThreshold: number): string {
  const t = edgeThreshold.toFixed(2);
  const strongT = (edgeThreshold * 1.5).toFixed(2);
  return `if (edge > ${t}) {
    float angle = atan(dy, dx);
    if (abs(angle) < 0.4) n = ${EDGE_CHARS.horizontal};
    else if (abs(angle) > 1.2) n = ${EDGE_CHARS.vertical};
    else if (angle > 0.0) n = ${EDGE_CHARS.forwardSlash};
    else n = ${EDGE_CHARS.backslash};
    if (abs(dx) > ${strongT} && abs(dy) > ${strongT}) n = ${EDGE_CHARS.cross};
  }`;
}
