import type { Constellation, IdeaRef, PipelineData } from "./types";
import { CONSTELLATION_TYPE_NAMES } from "./data-schema";

export const DERIVED_DATA_SCHEMA_VERSION = 1 as const;

export const LEADING_TECH_SOURCES = [
  { id: "hn", label: "Hacker News" },
  { id: "arxiv", label: "arXiv" },
  { id: "yc", label: "Y Combinator" },
  { id: "producthunt", label: "Product Hunt" },
  { id: "github", label: "GitHub Trending" },
  { id: "huggingface", label: "Hugging Face" },
  { id: "devto", label: "Dev.to" },
  { id: "betalist", label: "BetaList" },
  { id: "paperswithcode", label: "Papers With Code" },
] as const;

export type CompactIdea = Pick<IdeaRef, "url" | "title" | "source">;

export interface PublicSnapshotMetadata {
  generated_at: string;
  total_ideas: number;
  constellations_found: number;
  constellations_by_type: Record<string, number>;
}

export interface SnapshotMetrics {
  lastUpdated: string;
  ideasAnalyzed: number;
  totalConstellations: number;
  totalGaps: number;
  constellationsByType: Record<string, number>;
}

export interface SummaryData {
  schema_version: typeof DERIVED_DATA_SCHEMA_VERSION;
  metadata: PublicSnapshotMetadata;
  sources: string[];
}

export interface TopGap {
  constellationIndex: number;
  absence: Constellation;
  ideas: Record<number, CompactIdea>;
}

export interface TopGapsData {
  schema_version: typeof DERIVED_DATA_SCHEMA_VERSION;
  metadata: PublicSnapshotMetadata;
  gaps: TopGap[];
}

export interface ConstellationMapData {
  schema_version: typeof DERIVED_DATA_SCHEMA_VERSION;
  metadata: PublicSnapshotMetadata;
  constellations: Constellation[];
  ideas: Record<number, CompactIdea>;
}

export interface DerivedDataFiles {
  summary: SummaryData;
  topGaps: TopGapsData;
  constellations: ConstellationMapData;
}

function publicMetadata(data: PipelineData): PublicSnapshotMetadata {
  const generatedAt = data.metadata.generated_at;
  if (!generatedAt) {
    throw new Error("Cannot derive public data: metadata.generated_at is missing");
  }

  return {
    generated_at: generatedAt,
    total_ideas: data.metadata.total_ideas,
    constellations_found: data.metadata.constellations_found,
    constellations_by_type: { ...data.metadata.constellations_by_type },
  };
}

function compactIdea(idea: IdeaRef): CompactIdea {
  return { url: idea.url, title: idea.title, source: idea.source };
}

function compactIdeas(
  ideaIds: Iterable<number>,
  ideas: Record<number, IdeaRef>,
): Record<number, CompactIdea> {
  const compact: Record<number, CompactIdea> = {};
  for (const id of new Set(ideaIds)) {
    const idea = ideas[id];
    if (!idea) throw new Error(`Cannot derive public data: idea ${id} is missing`);
    compact[id] = compactIdea(idea);
  }
  return compact;
}

export function getSnapshotMetrics(data: PipelineData): SnapshotMetrics {
  if (!data.metadata.generated_at) {
    throw new Error("Cannot calculate snapshot metrics: metadata.generated_at is missing");
  }

  return {
    lastUpdated: data.metadata.generated_at,
    ideasAnalyzed: data.metadata.total_ideas,
    totalConstellations: data.metadata.constellations_found,
    totalGaps: data.metadata.constellations_by_type.absence ?? 0,
    constellationsByType: Object.fromEntries(
      CONSTELLATION_TYPE_NAMES.map((type) => [
        type,
        data.metadata.constellations_by_type[type] ?? 0,
      ]),
    ),
  };
}

export function selectTopGaps(data: PipelineData, limit = 12): TopGap[] {
  if (!Number.isInteger(limit) || limit < 0) {
    throw new Error("Top-gap limit must be a non-negative integer");
  }

  const rank = (constellation: Constellation) =>
    constellation.score * 0.5 + (constellation.actionability ?? 5) * 0.5;

  return data.constellations
    .map((absence, constellationIndex) => ({ absence, constellationIndex }))
    .filter(({ absence }) => absence.constellation_type === "absence")
    .sort(
      (a, b) =>
        rank(b.absence) - rank(a.absence) ||
        a.constellationIndex - b.constellationIndex,
    )
    .slice(0, limit)
    .map(({ absence, constellationIndex }) => ({
      constellationIndex,
      absence,
      ideas: compactIdeas(absence.idea_ids, data.ideas),
    }));
}

export function buildDerivedData(data: PipelineData): DerivedDataFiles {
  const metadata = publicMetadata(data);
  const referencedIdeaIds = data.constellations.flatMap(
    (constellation) => constellation.idea_ids,
  );
  const configuredSourceIds = new Set(
    LEADING_TECH_SOURCES.map((source) => source.id as string),
  );
  const unknownSources = Array.from(
    new Set(
      Object.values(data.ideas)
        .map((idea) => idea.source)
        .filter((source) => !configuredSourceIds.has(source)),
    ),
  );
  if (unknownSources.length > 0) {
    throw new Error(
      `Cannot derive public data: unconfigured sources ${unknownSources.join(", ")}`,
    );
  }

  return {
    summary: {
      schema_version: DERIVED_DATA_SCHEMA_VERSION,
      metadata,
      sources: LEADING_TECH_SOURCES.map((source) => source.label),
    },
    topGaps: {
      schema_version: DERIVED_DATA_SCHEMA_VERSION,
      metadata,
      gaps: selectTopGaps(data),
    },
    constellations: {
      schema_version: DERIVED_DATA_SCHEMA_VERSION,
      metadata,
      constellations: data.constellations,
      ideas: compactIdeas(referencedIdeaIds, data.ideas),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function assertPublicMetadata(value: unknown): asserts value is PublicSnapshotMetadata {
  if (!isRecord(value)) throw new Error("Derived metadata must be an object");
  if (
    typeof value.generated_at !== "string" ||
    Number.isNaN(Date.parse(value.generated_at))
  ) {
    throw new Error("Derived metadata.generated_at must be a valid timestamp");
  }
  if (!isNonNegativeInteger(value.total_ideas)) {
    throw new Error("Derived metadata.total_ideas must be a non-negative integer");
  }
  if (!isNonNegativeInteger(value.constellations_found)) {
    throw new Error(
      "Derived metadata.constellations_found must be a non-negative integer",
    );
  }
  if (!isRecord(value.constellations_by_type)) {
    throw new Error("Derived metadata.constellations_by_type must be an object");
  }
}

function assertCompactIdeas(value: unknown): asserts value is Record<number, CompactIdea> {
  if (!isRecord(value)) throw new Error("Derived ideas must be an object");
  for (const [id, idea] of Object.entries(value)) {
    if (!/^\d+$/.test(id) || !isRecord(idea)) {
      throw new Error(`Derived idea ${id} is invalid`);
    }
    for (const field of ["url", "title", "source"]) {
      if (typeof idea[field] !== "string") {
        throw new Error(`Derived idea ${id}.${field} must be a string`);
      }
    }
  }
}

function assertConstellation(value: unknown, index: number): asserts value is Constellation {
  if (!isRecord(value)) throw new Error(`Derived constellation ${index} is invalid`);
  for (const field of [
    "neighborhood_hash",
    "constellation_type",
    "title",
    "explanation",
    "model",
    "prompt_version",
  ]) {
    if (typeof value[field] !== "string") {
      throw new Error(`Derived constellation ${index}.${field} must be a string`);
    }
  }
  if (!Array.isArray(value.idea_ids) || !value.idea_ids.every(isNonNegativeInteger)) {
    throw new Error(`Derived constellation ${index}.idea_ids must be integer IDs`);
  }
  if (typeof value.score !== "number" || !Number.isFinite(value.score)) {
    throw new Error(`Derived constellation ${index}.score must be a finite number`);
  }
}

function assertVersion(value: Record<string, unknown>): void {
  if (value.schema_version !== DERIVED_DATA_SCHEMA_VERSION) {
    throw new Error("Unsupported derived data schema version");
  }
}

export function parseSummaryData(value: unknown): SummaryData {
  if (!isRecord(value)) throw new Error("Summary data must be an object");
  assertVersion(value);
  assertPublicMetadata(value.metadata);
  if (!Array.isArray(value.sources) || !value.sources.every((source) => typeof source === "string")) {
    throw new Error("Summary sources must be an array of strings");
  }
  return value as unknown as SummaryData;
}

export function parseTopGapsData(value: unknown): TopGapsData {
  if (!isRecord(value)) throw new Error("Top-gaps data must be an object");
  assertVersion(value);
  assertPublicMetadata(value.metadata);
  if (!Array.isArray(value.gaps)) throw new Error("Top-gaps data must contain gaps");
  value.gaps.forEach((gap, index) => {
    if (!isRecord(gap) || !isNonNegativeInteger(gap.constellationIndex)) {
      throw new Error(`Top gap ${index} has an invalid constellation index`);
    }
    assertConstellation(gap.absence, index);
    if (gap.absence.constellation_type !== "absence") {
      throw new Error(`Top gap ${index} is not an absence`);
    }
    assertCompactIdeas(gap.ideas);
    for (const ideaId of gap.absence.idea_ids) {
      if (!(ideaId in gap.ideas)) {
        throw new Error(`Top gap ${index} references missing idea ${ideaId}`);
      }
    }
  });
  return value as unknown as TopGapsData;
}

export function parseConstellationMapData(value: unknown): ConstellationMapData {
  if (!isRecord(value)) throw new Error("Constellation data must be an object");
  assertVersion(value);
  assertPublicMetadata(value.metadata);
  if (!Array.isArray(value.constellations)) {
    throw new Error("Constellation data must contain a constellations array");
  }
  const ideas = value.ideas;
  assertCompactIdeas(ideas);
  value.constellations.forEach((constellation, index) => {
    assertConstellation(constellation, index);
    for (const ideaId of constellation.idea_ids) {
      if (!(ideaId in ideas)) {
        throw new Error(`Derived constellation ${index} references missing idea ${ideaId}`);
      }
    }
  });
  if (value.constellations.length !== value.metadata.constellations_found) {
    throw new Error("Derived constellation count does not match metadata");
  }
  return value as unknown as ConstellationMapData;
}
