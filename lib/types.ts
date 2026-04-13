// SYNC NOTE: These types are duplicated from constellate-engine/src/types/index.ts.
// Update both files when changing Constellation, EmergentPattern, IdeaRef, or PipelineMetadata.

export interface Constellation {
  neighborhood_hash: string;
  constellation_type: string;
  idea_ids: number[];
  title: string;
  explanation: string;
  score: number;
  model: string;
  prompt_version: string;
}

export interface EmergentPattern {
  cluster_hash: string;
  pattern_title: string;
  pattern_description: string;
  idea_ids: number[];
  model: string;
  prompt_version: string;
}

export interface IdeaRef {
  url: string;
  title: string;
  source: string;
  category: string;
  description: string;
}

export interface PipelineMetadata {
  total_ideas: number;
  neighborhoods_total: number;
  constellations_found: number;
  constellations_by_type: Record<string, number>;
  constellation_cache_hits: number;
  constellation_api_calls: number;
  pattern_cache_hits: number;
  pattern_api_calls: number;
  estimated_cost_usd: number;
  elapsed_ms: number;
}

export interface PipelineData {
  constellations: Constellation[];
  patterns: EmergentPattern[];
  ideas: Record<number, IdeaRef>;
  metadata: PipelineMetadata;
}

export const TYPE_COLORS: Record<string, string> = {
  chain: "#FF6B6B",
  triangulation: "#4ECDC4",
  convergence: "#FFD166",
  absence: "#A78BFA",
  spectrum: "#95E1D3",
};

export const TYPE_LABELS: Record<string, string> = {
  chain: "Chain",
  triangulation: "Triangulation",
  convergence: "Convergence",
  absence: "Absence",
  spectrum: "Spectrum",
};

export const TYPE_SHORT: Record<string, string> = {
  chain: "Ideas forming a logical progression nobody designed on purpose. Each step enables the next.",
  triangulation: "Three ideas illuminating the same phenomenon from different angles. No single one names it; together they do.",
  convergence: "Distant domains unknowingly pointing to the same underlying problem or solution.",
  absence: "A logical gap — what should be here but isn't. Constellate detects what's missing.",
  spectrum: "Ideas representing different positions on the same axis of debate. The insight is the axis itself.",
};

export const SOURCE_EMOJI: Record<string, string> = {
  github: "\uD83D\uDC19",
  hn: "\uD83D\uDD36",
  arxiv: "\uD83D\uDCC4",
  producthunt: "\uD83D\uDE80",
  yc: "\uD83D\uDFE0",
  devto: "\u270D\uFE0F",
  huggingface: "\uD83E\uDD17",
  betalist: "\uD83C\uDF1F",
  paperswithcode: "\uD83D\uDCDA",
};
