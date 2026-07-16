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

const CONSTELLATION_TYPES = new Set([
  "chain",
  "triangulation",
  "convergence",
  "absence",
  "spectrum",
]);

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

  if (
    value.generated_at !== undefined &&
    (typeof value.generated_at !== "string" || Number.isNaN(Date.parse(value.generated_at)))
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
    "estimated_cost_usd",
    "elapsed_ms",
  ]) {
    requireNumber(value, key, "metadata", errors);
  }

  for (const key of ["constellation_failed_skips", "pattern_failed_skips"]) {
    if (value[key] !== undefined) requireNumber(value, key, "metadata", errors);
  }

  if (!isRecord(value.constellations_by_type)) {
    errors.push("metadata.constellations_by_type must be an object");
  } else {
    for (const [key, count] of Object.entries(value.constellations_by_type)) {
      if (!isFiniteNumber(count) || count < 0) {
        errors.push(`metadata.constellations_by_type.${key} must be a non-negative number`);
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

  validateMetadata(value.metadata, errors);
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
