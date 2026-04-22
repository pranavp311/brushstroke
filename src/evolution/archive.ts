import type { PageSpec } from "../composition/page-engine.js";
import {
  GRID_SIZE,
  descriptorKey,
  type ArchiveStats,
  type Cell,
  type DescriptorVector,
  type Individual,
} from "./types.js";

export interface SerializedArchive {
  cells: Array<{
    key: string;
    descriptor: DescriptorVector;
    spec: PageSpec;
    fitness: number;
    overallScore: number;
    categories: Individual["categories"];
    generation: number;
    parent?: string;
    createdAt: number;
  }>;
  stats: ArchiveStats;
  designBrief: string;
  savedAt: string;
}

export class Archive {
  private cells: Map<string, Cell> = new Map();
  private generationsRun = 0;
  private totalEvaluations = 0;

  get size(): number {
    return this.cells.size;
  }

  tryInsert(candidate: Individual): { inserted: boolean; replaced: boolean; key: string } {
    this.totalEvaluations += 1;
    const key = descriptorKey(candidate.descriptor);
    const existing = this.cells.get(key);
    if (!existing) {
      this.cells.set(key, { key, descriptor: candidate.descriptor, elite: candidate });
      return { inserted: true, replaced: false, key };
    }
    if (candidate.fitness > existing.elite.fitness) {
      this.cells.set(key, { key, descriptor: candidate.descriptor, elite: candidate });
      return { inserted: true, replaced: true, key };
    }
    return { inserted: false, replaced: false, key };
  }

  sampleElite(rng: () => number = Math.random): Individual | undefined {
    if (this.cells.size === 0) return undefined;
    const keys = Array.from(this.cells.keys());
    const key = keys[Math.floor(rng() * keys.length)];
    return this.cells.get(key)?.elite;
  }

  listElites(): Individual[] {
    return Array.from(this.cells.values()).map((c) => c.elite);
  }

  get(descriptor: DescriptorVector): Individual | undefined {
    return this.cells.get(descriptorKey(descriptor))?.elite;
  }

  incrementGeneration(): void {
    this.generationsRun += 1;
  }

  stats(): ArchiveStats {
    const elites = this.listElites();
    const fitnesses = elites.map((e) => e.fitness);
    const sum = fitnesses.reduce((a, b) => a + b, 0);
    return {
      occupiedCells: this.cells.size,
      totalCells: GRID_SIZE,
      coverage: this.cells.size / GRID_SIZE,
      meanFitness: elites.length ? sum / elites.length : 0,
      maxFitness: elites.length ? Math.max(...fitnesses) : 0,
      generationsRun: this.generationsRun,
      totalEvaluations: this.totalEvaluations,
    };
  }

  serialize(designBrief: string, options: { includeScreenshots?: boolean } = {}): SerializedArchive {
    const cells = Array.from(this.cells.values()).map((c) => ({
      key: c.key,
      descriptor: c.descriptor,
      spec: c.elite.spec,
      fitness: c.elite.fitness,
      overallScore: c.elite.overallScore,
      categories: c.elite.categories,
      generation: c.elite.generation,
      parent: c.elite.parent,
      createdAt: c.elite.createdAt,
      ...(options.includeScreenshots && c.elite.screenshot
        ? { screenshot: c.elite.screenshot }
        : {}),
    }));
    return {
      cells,
      stats: this.stats(),
      designBrief,
      savedAt: new Date().toISOString(),
    };
  }

  static fromSerialized(serialized: SerializedArchive): Archive {
    const archive = new Archive();
    for (const c of serialized.cells) {
      archive.cells.set(c.key, {
        key: c.key,
        descriptor: c.descriptor,
        elite: {
          spec: c.spec,
          fitness: c.fitness,
          overallScore: c.overallScore,
          categories: c.categories,
          descriptor: c.descriptor,
          generation: c.generation,
          parent: c.parent,
          createdAt: c.createdAt,
        },
      });
    }
    archive.generationsRun = serialized.stats.generationsRun;
    archive.totalEvaluations = serialized.stats.totalEvaluations;
    return archive;
  }
}
