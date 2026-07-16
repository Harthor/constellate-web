import type {
  Constellation,
  EmergentPattern,
  IdeaRef,
  PipelineData,
  PipelineMetadata,
} from "@/lib/types";

type ValidationResult =
  | { success: true; data: PipelineData }
  | { success: false; errors: string[] };

export const CONSTELLATION_TYPE_NAMES = [
  "chain",
  "triangulation",
  "convergence",
  "absence",
  "spectrum",
] as const;

const CONSTELLATION_TYPES = new Set<string>(CONSTELLATION_TYPE_NAMES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function requireString(
  value: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): void {
  if (typeof value[key] !== "string") errors.push(`${path}.${key} must be a string`);
}

function requireNumber(
  value: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): void {
  if (!isFiniteNumber(value[key])) errors.push(`${path}.${key} must be a finite number`);
}

function requireNonNegativeInteger(
  value: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): void {
  const candidate = value[key];
  if (!Number.isInteger(candidate) || (candidate as number) < 0) {
    errors.push(`${path}.${key} must be a non-negative integer`);
  }
}

function validateIdea(value: unknown, path: string, errors: string[]): value is IdeaRef {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }

  requireString(value, "url", path, errors);
  requireString(value, "title", path, errors);
  requireString(value, "source", path, errors);
  requireString(value, "category", path, errors);
  requireString(value, "description", path, errors);
  return true;
}

function validateIdeaIds(
  value: unknown,
  path: string,
  knownIdeaIds: Set<number>,
  errors: string[],
): value is number[] {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return false;
  }

  for (const [index, id] of value.entries()) {
    if (!Number.isInteger(id) || (id as number) < 0) {
      errors.push(`${path}[${index}] must be a non-negative integer`);
    } else if (!knownIdeaIds.has(id as number)) {
      errors.push(`${path}[${index}] references missing idea ${id}`);
    }
  }
  return true;
}

function validateConstellation(
  value: unknown,
  index: number,
  knownIdeaIds: Set<number>,
  errors: string[],
): value is Constellation {
  const path = `constellations[${index}]`;
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }

  requireString(value, "neighborhood_hash", path, errors);
  requireString(value, "constellation_type", path, errors);
  requireString(value, "title", path, errors);
  requireString(value, "explanation", path, errors);
  requireString(value, "model", path, errors);
  requireString(value, "prompt_version", path, errors);
  requireNumber(value, "score", path, errors);
  validateIdeaIds(value.idea_ids, `${path}.idea_ids`, knownIdeaIds, errors);

  if (
    typeof value.constellation_type === "string" &&
    !CONSTELLATION_TYPES.has(value.constellation_type)
  ) {
    errors.push(`${path}.constellation_type is not supported`);
  }
  if (value.actionability !== undefined && !isFiniteNumber(value.actionability)) {
    errors.push(`${path}.actionability must be a finite number when present`);
  }
  return true;
}

function validatePattern(
  value: unknown,
  index: number,
  knownIdeaIds: Set<number>,
  errors: string[],
): value is EmergentPattern {
  const path = `patterns[${index}]`;
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }

  requireString(value, "cluster_hash", path, errors);
  requireString(value, "pattern_title", path, errors);
  requireString(value, "pattern_description", path, errors);
  requireString(value, "model", path, errors);
  requireString(value, "prompt_version", path, errors);
  validateIdeaIds(value.idea_ids, `${path}.idea_ids`, knownIdeaIds, errors);
  return true;
}

function validateMetadata(value: unknown, errors: string[]): value is PipelineMetadata {
  if (!isRecord(value)) {
    errors.push("metadata must be an object");
    return false;
  }

  if (typeof value.generated_at !== "string" || value.generated_at.trim() === "") {
    errors.push("metadata.generated_at is required");
  } else if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value.generated_at,
    ) || Number.isNaN(Date.parse(value.generated_at))
  ) {
    errors.push("metadata.generated_at must be an ISO-8601 timestamp");
  }

  for (const key of [
    "total_ideas",
    "neighborhoods_total",
    "constellations_found",
    "constellation_cache_hits",
    "constellation_api_calls",
    "pattern_cache_hits",
    "pattern_api_calls",
  ]) {
    requireNonNegativeInteger(value, key, "metadata", errors);
  }

  for (const key of ["constellation_failed_skips", "pattern_failed_skips"]) {
    if (value[key] !== undefined) {
      requireNonNegativeInteger(value, key, "metadata", errors);
    }
  }

  for (const key of ["estimated_cost_usd", "elapsed_ms"]) {
    requireNumber(value, key, "metadata", errors);
    if (isFiniteNumber(value[key]) && value[key] < 0) {
      errors.push(`metadata.${key} must not be negative`);
    }
  }

  if (!isRecord(value.constellations_by_type)) {
    errors.push("metadata.constellations_by_type must be an object");
  } else {
    for (const [key, count] of Object.entries(value.constellations_by_type)) {
      if (!CONSTELLATION_TYPES.has(key)) {
        errors.push(`metadata.constellations_by_type.${key} is not supported`);
      }
      if (!Number.isInteger(count) || (count as number) < 0) {
        errors.push(`metadata.constellations_by_type.${key} must be a non-negative integer`);
      }
    }
  }
  return true;
}

export function validatePipelineData(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) return { success: false, errors: ["root must be an object"] };

  const ideasValue = value.ideas;
  if (!isRecord(ideasValue)) {
    errors.push("ideas must be an object keyed by numeric id");
  }

  const ideas: Record<number, IdeaRef> = {};
  const knownIdeaIds = new Set<number>();
  if (isRecord(ideasValue)) {
    for (const [rawId, idea] of Object.entries(ideasValue)) {
      const id = Number(rawId);
      if (!Number.isInteger(id) || id < 0) {
        errors.push(`ideas.${rawId} must use a non-negative integer key`);
        continue;
      }
      knownIdeaIds.add(id);
      if (validateIdea(idea, `ideas.${rawId}`, errors)) ideas[id] = idea;
    }
  }

  const constellations: Constellation[] = [];
  if (!Array.isArray(value.constellations)) {
    errors.push("constellations must be an array");
  } else {
    value.constellations.forEach((item, index) => {
      if (validateConstellation(item, index, knownIdeaIds, errors)) constellations.push(item);
    });
  }

  const patterns: EmergentPattern[] = [];
  if (!Array.isArray(value.patterns)) {
    errors.push("patterns must be an array");
  } else {
    value.patterns.forEach((item, index) => {
      if (validatePattern(item, index, knownIdeaIds, errors)) patterns.push(item);
    });
  }

  const metadataIsValid = validateMetadata(value.metadata, errors);
  if (metadataIsValid) {
    const metadata = value.metadata as unknown as PipelineMetadata;
    const actualIdeaCount = Object.keys(ideas).length;
    if (metadata.total_ideas !== actualIdeaCount) {
      errors.push(
        `metadata.total_ideas is ${metadata.total_ideas}, but ideas contains ${actualIdeaCount} records`,
      );
    }

    if (metadata.constellations_found !== constellations.length) {
      errors.push(
        `metadata.constellations_found is ${metadata.constellations_found}, but constellations contains ${constellations.length} records`,
      );
    }

    const actualByType = Object.fromEntries(
      CONSTELLATION_TYPE_NAMES.map((type) => [
        type,
        constellations.filter((constellation) => constellation.constellation_type === type)
          .length,
      ]),
    );
    for (const type of CONSTELLATION_TYPE_NAMES) {
      const declared = metadata.constellations_by_type[type] ?? 0;
      if (declared !== actualByType[type]) {
        errors.push(
          `metadata.constellations_by_type.${type} is ${declared}, but ${actualByType[type]} ${type} constellations exist`,
        );
      }
    }

    const declaredTypeTotal = Object.values(metadata.constellations_by_type).reduce(
      (sum, count) => sum + count,
      0,
    );
    if (declaredTypeTotal !== metadata.constellations_found) {
      errors.push(
        `metadata.constellations_by_type sums to ${declaredTypeTotal}, but metadata.constellations_found is ${metadata.constellations_found}`,
      );
    }
  }
  if (errors.length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      constellations,
      patterns,
      ideas,
      metadata: value.metadata as unknown as PipelineMetadata,
    },
  };
}

export function parsePipelineData(value: unknown): PipelineData {
  const result = validatePipelineData(value);
  if (!result.success) {
    throw new Error(`Invalid constellation data: ${result.errors.slice(0, 5).join("; ")}`);
  }
  return result.data;
}
