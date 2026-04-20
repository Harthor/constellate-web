import Link from "next/link";
import type { Constellation, IdeaRef } from "@/lib/types";
import { SOURCE_EMOJI } from "@/lib/types";

interface AbsenceCardProps {
  absence: Constellation;
  ideas: Record<number, IdeaRef>;
  /**
   * Global index of this constellation in the `constellations` array.
   * Used as a unique deep-link target because `neighborhood_hash` is shared
   * across multiple constellations derived from the same neighborhood.
   */
  constellationIndex: number;
}

// Strip a leading "Missing: " (case-insensitive) — the engine produces many
// absence titles with that prefix, but the card itself already communicates
// "gap detected", so repeating "Missing:" in the title is redundant.
function cleanTitle(raw: string): string {
  return raw.replace(/^\s*missing\s*:\s*/i, "").trim();
}

export default function AbsenceCard({ absence, ideas, constellationIndex }: AbsenceCardProps) {
  const title = cleanTitle(absence.title);
  const ideaCount = absence.idea_ids.length;
  const href = `/constellation-map?c=${constellationIndex}`;

  // Show up to 4 source emojis from the ideas backing this gap, so the card
  // signals provenance without dragging in full idea titles.
  const sources = Array.from(
    new Set(
      absence.idea_ids
        .map((id) => ideas[id]?.source)
        .filter((s): s is string => Boolean(s)),
    ),
  ).slice(0, 5);

  return (
    <article
      className="group flex h-full flex-col rounded-xl border p-6 transition-colors"
      style={{
        background:
          "linear-gradient(135deg, rgba(167,139,250,0.06), rgba(142,220,230,0.04) 70%)",
        borderColor: "rgba(167,139,250,0.25)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
          style={{
            background: "rgba(167,139,250,0.25)",
            color: "#E9E2FF",
          }}
        >
          ∅
        </span>
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "#C4B5FD" }}
        >
          Gap detected
        </span>
      </div>

      <h3 className="mt-4 text-xl font-semibold leading-snug text-white">
        {title}
      </h3>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-white/65">
        {absence.explanation}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-xs text-white/50">
          <span className="font-mono text-sm font-semibold text-white/80">
            {ideaCount}
          </span>{" "}
          ideas point to this gap
        </span>
        {sources.length > 0 && (
          <span
            className="flex items-center gap-1 text-sm"
            aria-label={`From sources: ${sources.join(", ")}`}
          >
            {sources.map((s) => (
              <span key={s} title={s}>
                {SOURCE_EMOJI[s] ?? "\uD83D\uDCCC"}
              </span>
            ))}
          </span>
        )}
      </div>

      <Link
        href={href}
        className="mt-5 inline-flex items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        style={{
          background: "rgba(167,139,250,0.15)",
          color: "#C4B5FD",
          border: "1px solid rgba(167,139,250,0.3)",
        }}
      >
        Explore connections
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </article>
  );
}
