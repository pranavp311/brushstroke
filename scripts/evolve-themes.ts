#!/usr/bin/env tsx
/**
 * MAP-Elites evolutionary search over Brushstroke PageSpecs.
 *
 * Seeds from the gallery, mutates via param-patcher, evaluates each candidate
 * with the VLM design scorer, and maintains a grid archive keyed by cheap
 * structural descriptors (palette family × typographic voice × motion density).
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { argv, exit, stdout } from "node:process";

import type { PageSpec } from "../src/composition/page-engine.js";
import {
  GALLERY_DARK_PREMIUM,
  GALLERY_LIGHT_CLEAN,
  GALLERY_STARTUP_BOLD,
  GALLERY_EDITORIAL,
  GALLERY_MINIMAL,
} from "../src/resources/galleries/index.js";

import { Archive } from "../src/evolution/archive.js";
import { mutate } from "../src/evolution/mutation.js";
import { computeDescriptor } from "../src/evolution/descriptors.js";
import { evaluateSpec } from "../src/evolution/evaluator.js";
import type { ArchiveConfig, Individual } from "../src/evolution/types.js";

interface CliArgs {
  generations: number;
  out: string;
  brief: string;
  vlmProvider: "ollama" | "together" | "fireworks" | "openai";
  vlmModel: string;
  vlmApiKey?: string;
  seedPerturbations: number;
  saveScreenshots: boolean;
  mock: boolean;
}

function parseArgs(): CliArgs {
  const args: Partial<CliArgs> = {};
  const raw = argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    const next = () => raw[++i];
    if (a === "--generations") args.generations = parseInt(next(), 10);
    else if (a === "--out") args.out = next();
    else if (a === "--brief") args.brief = next();
    else if (a === "--vlm-provider") args.vlmProvider = next() as CliArgs["vlmProvider"];
    else if (a === "--vlm-model") args.vlmModel = next();
    else if (a === "--vlm-api-key") args.vlmApiKey = next();
    else if (a === "--seed-perturbations") args.seedPerturbations = parseInt(next(), 10);
    else if (a === "--save-screenshots") args.saveScreenshots = true;
    else if (a === "--mock") args.mock = true;
    else if (a === "--help" || a === "-h") {
      printHelp();
      exit(0);
    }
  }
  return {
    generations: args.generations ?? 200,
    out: args.out ?? "src/resources/content/evolved-gallery.json",
    brief:
      args.brief ??
      "A distinctive, beautiful 3D landing page that avoids generic AI-generated aesthetics. Evaluate on composition, color, typography, and how well the 3D integrates with layout.",
    vlmProvider: args.vlmProvider ?? "ollama",
    vlmModel: args.vlmModel ?? "qwen2.5-vl:7b",
    vlmApiKey: args.vlmApiKey,
    seedPerturbations: args.seedPerturbations ?? 3,
    saveScreenshots: args.saveScreenshots ?? false,
    mock: args.mock ?? false,
  };
}

function printHelp(): void {
  stdout.write(`
evolve-themes — MAP-Elites over Brushstroke PageSpecs

Usage:
  npx tsx scripts/evolve-themes.ts [options]

Options:
  --generations N         Number of generations (default: 200)
  --out PATH              Output JSON path (default: src/resources/content/evolved-gallery.json)
  --brief TEXT            Design brief passed to VLM
  --vlm-provider NAME     ollama | openai | together | fireworks (default: ollama)
  --vlm-model NAME        Model id (default: qwen2.5-vl:7b)
  --vlm-api-key KEY       API key for cloud providers
  --seed-perturbations N  Random perturbations per gallery seed (default: 3)
  --save-screenshots      Embed first screenshot per cell in output JSON
  --mock                  Skip render+VLM, use deterministic fake fitness (smoke test)
  --help, -h              Show this message
`);
}

const GALLERY_SEEDS: PageSpec[] = [
  GALLERY_DARK_PREMIUM,
  GALLERY_LIGHT_CLEAN,
  GALLERY_STARTUP_BOLD,
  GALLERY_EDITORIAL,
  GALLERY_MINIMAL,
] as unknown as PageSpec[];

async function main() {
  const args = parseArgs();
  const config: ArchiveConfig = {
    designBrief: args.brief,
    vlmProvider: args.vlmProvider,
    vlmModel: args.vlmModel,
    vlmApiKey: args.vlmApiKey,
  };

  log(`MAP-Elites: ${args.generations} generations, VLM=${args.vlmProvider}/${args.vlmModel}${args.mock ? " [MOCK]" : ""}`);
  log(`Output: ${args.out}`);

  const archive = new Archive();

  const seedPool: PageSpec[] = [];
  for (const s of GALLERY_SEEDS) {
    seedPool.push(structuredClone(s));
    for (let i = 0; i < args.seedPerturbations; i++) {
      seedPool.push(mutate(structuredClone(s), { rng: Math.random }));
    }
  }

  log(`Seeding archive with ${seedPool.length} individuals...`);
  for (let i = 0; i < seedPool.length; i++) {
    const spec = seedPool[i];
    const result = await evaluate(spec, config, args.mock);
    if (result.failed) {
      log(`  seed ${i + 1}/${seedPool.length}: FAILED (${result.errorMessage})`);
      continue;
    }
    const ind: Individual = {
      spec,
      fitness: result.fitness,
      overallScore: result.overallScore,
      categories: result.categories,
      descriptor: result.descriptor,
      screenshot: result.screenshot,
      generation: 0,
      createdAt: Date.now(),
    };
    const { inserted } = archive.tryInsert(ind);
    log(
      `  seed ${i + 1}/${seedPool.length}: fitness=${result.fitness.toFixed(1)} cell=${result.descriptor.palette}|${result.descriptor.typography}|${result.descriptor.motion}${inserted ? " [NEW]" : ""}`,
    );
  }

  const initialStats = archive.stats();
  log(`Seed phase done. Occupied ${initialStats.occupiedCells}/${initialStats.totalCells} cells (${(initialStats.coverage * 100).toFixed(1)}%).`);

  for (let gen = 1; gen <= args.generations; gen++) {
    archive.incrementGeneration();
    const parent = archive.sampleElite();
    if (!parent) {
      log(`gen ${gen}: archive is empty; stopping.`);
      break;
    }
    const child = mutate(structuredClone(parent.spec), { pool: archive.listElites() });
    const result = await evaluate(child, config, args.mock);
    if (result.failed) {
      log(`gen ${gen}: FAILED (${result.errorMessage})`);
      continue;
    }
    const candidate: Individual = {
      spec: child,
      fitness: result.fitness,
      overallScore: result.overallScore,
      categories: result.categories,
      descriptor: result.descriptor,
      screenshot: result.screenshot,
      generation: gen,
      parent: cellKeyOf(parent),
      createdAt: Date.now(),
    };
    const { inserted, replaced, key } = archive.tryInsert(candidate);
    const status = inserted ? (replaced ? "REPLACED" : "NEW") : "rejected";
    log(
      `gen ${gen}/${args.generations}: fitness=${result.fitness.toFixed(1)} cell=${key} [${status}]`,
    );

    if (gen % 25 === 0) {
      const s = archive.stats();
      log(
        `  checkpoint: ${s.occupiedCells}/${s.totalCells} cells, meanFit=${s.meanFitness.toFixed(1)}, maxFit=${s.maxFitness.toFixed(1)}`,
      );
    }
  }

  const finalStats = archive.stats();
  log(`\nFinal: ${finalStats.occupiedCells}/${finalStats.totalCells} cells (${(finalStats.coverage * 100).toFixed(1)}%)`);
  log(`  meanFitness=${finalStats.meanFitness.toFixed(1)}, maxFitness=${finalStats.maxFitness.toFixed(1)}`);
  log(`  totalEvaluations=${finalStats.totalEvaluations}`);

  const serialized = archive.serialize(args.brief, { includeScreenshots: args.saveScreenshots });
  const outPath = resolve(process.cwd(), args.out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(serialized, null, 2), "utf-8");
  log(`Wrote archive to ${outPath}`);
}

async function evaluate(spec: PageSpec, config: ArchiveConfig, mock: boolean) {
  if (mock) return mockEvaluate(spec);
  return evaluateSpec(spec, config);
}

function mockEvaluate(spec: PageSpec) {
  const descriptor = computeDescriptor(spec);
  const h = hashString(JSON.stringify(spec));
  const overall = 50 + (h % 50);
  const distinct = 40 + ((h * 31) % 60);
  const threeD = 40 + ((h * 17) % 60);
  const fitness = 0.5 * overall + 0.3 * distinct + 0.2 * threeD;
  return {
    fitness,
    overallScore: overall,
    categories: {
      aestheticMatch: overall,
      colorHarmony: overall,
      typography: overall,
      layout: overall,
      threeDIntegration: threeD,
      distinctiveness: distinct,
      technicalQuality: overall,
    },
    descriptor,
    screenshot: "",
    failed: false as const,
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function cellKeyOf(ind: Individual): string {
  return `${ind.descriptor.palette}|${ind.descriptor.typography}|${ind.descriptor.motion}`;
}

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  stdout.write(`[${ts}] ${msg}\n`);
}

main().catch((err) => {
  console.error("evolve-themes failed:", err);
  exit(1);
});
