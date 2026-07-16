import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parsePipelineData, validatePipelineData } from "../lib/data-schema";

function emptyDataset() {
  return {
    constellations: [],
    patterns: [],
    ideas: {},
    metadata: {
      generated_at: "2026-07-16T18:35:34.438Z",
      total_ideas: 0,
      neighborhoods_total: 0,
      constellations_found: 0,
      constellations_by_type: {},
      constellation_cache_hits: 0,
      constellation_api_calls: 0,
      pattern_cache_hits: 0,
      pattern_api_calls: 0,
      estimated_cost_usd: 0,
      elapsed_ms: 0,
    },
  };
}

function datasetWithAbsence() {
  return {
    ...emptyDataset(),
    ideas: {
      42: {
        url: "https://example.com/idea",
        title: "A valid idea",
        source: "hn",
        category: "technology",
        description: "A source idea used by the test constellation.",
      },
    },
    constellations: [
      {
        neighborhood_hash: "abc",
        constellation_type: "absence",
        idea_ids: [42],
        title: "Missing reference",
        explanation: "A valid absence backed by one idea.",
        score: 8,
        actionability: 7,
        model: "test-model",
        prompt_version: "test-v1",
      },
    ],
    metadata: {
      ...emptyDataset().metadata,
      total_ideas: 1,
      neighborhoods_total: 1,
      constellations_found: 1,
      constellations_by_type: { absence: 1 },
    },
  };
}

describe("validatePipelineData", () => {
  it("parses the checked-in canonical data.json", () => {
    const raw: unknown = JSON.parse(
      readFileSync(resolve(process.cwd(), "public/data.json"), "utf8"),
    );
    const result = validatePipelineData(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.total_ideas).toBe(Object.keys(result.data.ideas).length);
      expect(result.data.metadata.constellations_found).toBe(
        result.data.constellations.length,
      );
    }
  });

  it("accepts a valid empty dataset so the UI can render its empty state", () => {
    const result = validatePipelineData(emptyDataset());
    expect(result.success).toBe(true);
  });

  it("rejects malformed JSON-shaped data", () => {
    const result = validatePipelineData({ constellations: "not-an-array" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects missing metadata", () => {
    const withoutMetadata: Record<string, unknown> = emptyDataset();
    delete withoutMetadata.metadata;
    const result = validatePipelineData(withoutMetadata);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.join(" ")).toContain("metadata must be an object");
  });

  it("requires a valid ISO generated_at timestamp", () => {
    const dataset = emptyDataset();
    dataset.metadata.generated_at = "July sometime";
    const result = validatePipelineData(dataset);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.join(" ")).toContain("ISO-8601");
  });

  it("rejects constellation references to missing ideas", () => {
    const dataset = datasetWithAbsence();
    dataset.constellations[0].idea_ids = [99];
    const result = validatePipelineData(dataset);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.join(" ")).toContain("missing idea 99");
  });

  it("rejects a total_ideas count that differs from the idea records", () => {
    const dataset = datasetWithAbsence();
    dataset.metadata.total_ideas = 2;
    const result = validatePipelineData(dataset);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.join(" ")).toContain("ideas contains 1 records");
  });

  it("rejects a constellations_found count that differs from the array", () => {
    const dataset = datasetWithAbsence();
    dataset.metadata.constellations_found = 2;
    const result = validatePipelineData(dataset);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.join(" ")).toContain("constellations contains 1 records");
    }
  });

  it("rejects inconsistent constellation counts by type", () => {
    const dataset = datasetWithAbsence();
    dataset.metadata.constellations_by_type.absence = 0;
    Object.assign(dataset.metadata.constellations_by_type, { chain: 1 });
    const result = validatePipelineData(dataset);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.join(" ")).toContain("absence constellations exist");
      expect(result.errors.join(" ")).toContain("chain constellations exist");
    }
  });

  it("throws a clear parsing error for invalid pipeline data", () => {
    expect(() => parsePipelineData({ nope: true })).toThrow("Invalid constellation data");
  });
});
