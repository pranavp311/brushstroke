/**
 * Apply ParameterFix[] to params via dot-notation path splitting.
 */

import { ParameterFix } from "../types/tool-result.js";

export function applyFixes(
  currentParams: Record<string, unknown>,
  fixes: ParameterFix[],
  options?: { maxFixes?: number }
): { params: Record<string, unknown>; applied: string[]; skipped: string[] } {
  const maxFixes = options?.maxFixes ?? fixes.length;

  // Sort by impact (high > medium > low) then severity order
  const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...fixes]
    .filter(f => f.paramPath && f.suggestedValue !== undefined)
    .sort((a, b) => (impactOrder[a.impact] ?? 2) - (impactOrder[b.impact] ?? 2));

  const params = structuredClone(currentParams);
  const applied: string[] = [];
  const skipped: string[] = [];
  const usedPaths = new Set<string>();

  for (const fix of sorted) {
    if (applied.length >= maxFixes) break;

    // Detect conflicts — skip if a higher-impact fix already targeted this path
    if (usedPaths.has(fix.paramPath)) {
      skipped.push(`${fix.paramPath} (conflict with higher-impact fix)`);
      continue;
    }

    try {
      setNestedValue(params, fix.paramPath, fix.suggestedValue);
      applied.push(fix.paramPath);
      usedPaths.add(fix.paramPath);
    } catch {
      skipped.push(`${fix.paramPath} (failed to apply)`);
    }
  }

  return { params, applied, skipped };
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    // Handle array notation like "sections[0]"
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const arrKey = arrayMatch[1];
      const idx = parseInt(arrayMatch[2], 10);
      if (!Array.isArray(current[arrKey])) {
        current[arrKey] = [];
      }
      const arr = current[arrKey] as unknown[];
      if (arr[idx] === undefined || arr[idx] === null || typeof arr[idx] !== "object") {
        arr[idx] = {};
      }
      current = arr[idx] as Record<string, unknown>;
    } else {
      if (current[key] === undefined || current[key] === null || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
  }

  const lastKey = parts[parts.length - 1];
  const lastArrayMatch = lastKey.match(/^(\w+)\[(\d+)\]$/);
  if (lastArrayMatch) {
    const arrKey = lastArrayMatch[1];
    const idx = parseInt(lastArrayMatch[2], 10);
    if (!Array.isArray(current[arrKey])) {
      current[arrKey] = [];
    }
    (current[arrKey] as unknown[])[idx] = value;
  } else {
    current[lastKey] = value;
  }
}
