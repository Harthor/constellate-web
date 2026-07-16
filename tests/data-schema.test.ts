import { describe, expect, it } from "vitest";
import { validatePipelineData } from "../lib/data-schema";

function emptyDataset() {
  return {
    constellations: [],
    patterns: [],
    ideas: {},
    metadata: {
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

describe("validatePipelineData", () => {
  it("accepts a valid empty dataset so the UI can render its empty state", () => {
    const result = validatePipelineData(emptyDataset());
    expect(result.success).toBe(true);
  });

  it("rejects malformed JSON-shaped data", () => {
    const result = validatePipelineData({ constellations: "not-an-array" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects constellation references to missing ideas", () => {
    const dataset = emptyDataset();
    const result = validatePipelineData({
      ...dataset,
      constellations: [
        {
          neighborhood_hash: "abc",
          constellation_type: "absence",
          idea_ids: [42],
          title: "Missing reference",
          explanation: "The backing idea is absent.",
          score: 8,
          model: "claude-fable-5",
          prompt_version: "test-v1",
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.join(" ")).toContain("missing idea 42");
  });
});
