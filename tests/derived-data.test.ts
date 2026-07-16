import { describe, expect, it } from "vitest";
import {
  buildDerivedData,
  getSnapshotMetrics,
  parseConstellationMapData,
  parseSummaryData,
  parseTopGapsData,
  selectTopGaps,
} from "../lib/derived-data";
import type { Constellation, IdeaRef, PipelineData } from "../lib/types";

function idea(title: string, source = "hn"): IdeaRef {
  return {
    url: `https://example.com/${encodeURIComponent(title)}`,
    title,
    source,
    category: "technology",
    description: `Full description for ${title}`,
  };
}

function constellation(
  type: string,
  ideaId: number,
  score: number,
  actionability?: number,
): Constellation {
  return {
    neighborhood_hash: `${type}-${ideaId}`,
    constellation_type: type,
    idea_ids: [ideaId],
    title: `${type} ${ideaId}`,
    explanation: `Explanation for ${type} ${ideaId}`,
    score,
    actionability,
    model: "test-model",
    prompt_version: "test-v1",
  };
}

function fixture(): PipelineData {
  return {
    ideas: {
      1: idea("First", "hn"),
      2: idea("Second", "github"),
      3: idea("Unused", "arxiv"),
    },
    constellations: [
      constellation("absence", 1, 9, 4),
      constellation("chain", 2, 8),
      constellation("absence", 2, 7, 10),
    ],
    patterns: [],
    metadata: {
      generated_at: "2026-07-16T18:35:34.438Z",
      total_ideas: 3,
      neighborhoods_total: 3,
      constellations_found: 3,
      constellations_by_type: { absence: 2, chain: 1 },
      constellation_cache_hits: 0,
      constellation_api_calls: 0,
      pattern_cache_hits: 0,
      pattern_api_calls: 0,
      estimated_cost_usd: 0,
      elapsed_ms: 1,
    },
  };
}

describe("derived public data", () => {
  it("calculates snapshot metadata and per-type counts", () => {
    const metrics = getSnapshotMetrics(fixture());
    expect(metrics).toMatchObject({
      lastUpdated: "2026-07-16T18:35:34.438Z",
      ideasAnalyzed: 3,
      totalConstellations: 3,
      totalGaps: 2,
    });
    expect(metrics.constellationsByType).toEqual({
      chain: 1,
      triangulation: 0,
      convergence: 0,
      absence: 2,
      spectrum: 0,
    });
  });

  it("ranks only real absences and keeps their global indices", () => {
    const gaps = selectTopGaps(fixture(), 1);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].constellationIndex).toBe(2);
    expect(gaps[0].absence.constellation_type).toBe("absence");
    expect(gaps[0].ideas[2].title).toBe("Second");
  });

  it("generates compact, internally consistent files", () => {
    const derived = buildDerivedData(fixture());
    expect(derived.summary.sources).toHaveLength(9);
    expect(derived.summary.sources).toContain("Hacker News");
    expect(derived.summary.sources).toContain("Papers With Code");
    expect(Object.keys(derived.constellations.ideas)).toEqual(["1", "2"]);
    expect(derived.constellations.ideas[1]).toEqual({
      url: "https://example.com/First",
      title: "First",
      source: "hn",
    });
    expect(derived.constellations.ideas[1]).not.toHaveProperty("description");
    expect(derived.topGaps.gaps).toHaveLength(2);
  });

  it("round-trips every generated file through its public parser", () => {
    const derived = buildDerivedData(fixture());
    expect(parseSummaryData(JSON.parse(JSON.stringify(derived.summary)))).toEqual(
      derived.summary,
    );
    expect(parseTopGapsData(JSON.parse(JSON.stringify(derived.topGaps)))).toEqual(
      derived.topGaps,
    );
    expect(
      parseConstellationMapData(JSON.parse(JSON.stringify(derived.constellations))),
    ).toEqual(derived.constellations);
  });

  it("supports an empty but dated snapshot", () => {
    const empty = fixture();
    empty.ideas = {};
    empty.constellations = [];
    empty.metadata.total_ideas = 0;
    empty.metadata.constellations_found = 0;
    empty.metadata.constellations_by_type = {};
    const derived = buildDerivedData(empty);
    expect(derived.topGaps.gaps).toEqual([]);
    expect(derived.constellations.ideas).toEqual({});
  });

  it("refuses to derive a snapshot without generated_at", () => {
    const data = fixture();
    delete data.metadata.generated_at;
    expect(() => buildDerivedData(data)).toThrow("metadata.generated_at is missing");
  });
});
