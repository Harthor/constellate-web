"use client";

import Link from "next/link";
import { useState } from "react";
import type { Constellation, IdeaRef } from "@/lib/types";
import { SOURCE_EMOJI } from "@/lib/types";

// Human-readable source names — used for aria-labels and hover tooltips so
// screen readers get "Hacker News, arXiv" instead of the emojis.
const SOURCE_LABEL: Record<string, string> = {
  github: "GitHub",
  hn: "Hacker News",
  arxiv: "arXiv",
  producthunt: "Product Hunt",
  yc: "Y Combinator",
  devto: "Dev.to",
  huggingface: "Hugging Face",
  betalist: "BetaList",
  paperswithcode: "Papers With Code",
};

interface AbsenceCardProps {
  absence: Constellation;
  ideas: Record<number, IdeaRef>;
  /**
   * Global index of this constellation in the `constellations` array.
   * Used as a unique deep-link target because `neighborhood_hash` is shared
   * across multiple constellations derived from the same neighborhood.
   */
  constellationIndex: number;
  /**
   * When true, attaches the `flash-target` class the ScrollFlash component
   * looks for to pulse a ring after the "See this week's gaps" CTA scrolls
   * the user down.
   */
  isFlashTarget?: boolean;
}

// Strip a leading "Missing: " (case-insensitive) — the engine produces many
// absence titles with that prefix, but the card itself already communicates
// "gap detected", so repeating "Missing:" in the title is redundant.
function cleanTitle(raw: string): string {
  return raw.replace(/^\s*missing\s*:\s*/i, "").trim();
}

export default function AbsenceCard({
  absence,
  ideas,
  constellationIndex,
  isFlashTarget = false,
}: AbsenceCardProps) {
  const [showIdeas, setShowIdeas] = useState(false);
  const title = cleanTitle(absence.title);
  const ideaCount = absence.idea_ids.length;
  const href = `/constellation-map?c=${constellationIndex}`;

  // Resolve backing ideas once so the expanded list can render them.
  const backingIdeas = absence.idea_ids
    .map((id) => ({ id, idea: ideas[id] }))
    .filter((x): x is { id: number; idea: IdeaRef } => Boolean(x.idea));

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
      className={
        "group flex h-full flex-col rounded-xl border p-6 transition-colors" +
        (isFlashTarget ? " flash-target" : "")
      }
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
        <button
          type="button"
          onClick={() => setShowIdeas((v) => !v)}
          aria-expanded={showIdeas}
          aria-controls={`ideas-${constellationIndex}`}
          className="flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4B5FD] rounded"
        >
          <span className="font-mono text-sm font-semibold text-white/80">
            {ideaCount}
          </span>
          ideas point to this gap
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            aria-hidden="true"
            style={{
              transform: showIdeas ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 150ms ease",
            }}
          >
            <path
              d="M2 3.5 L5 6.5 L8 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {sources.length > 0 && (
          <span
            className="flex items-center gap-1 text-sm"
            aria-label={`Sources: ${sources.map((s) => SOURCE_LABEL[s] ?? s).join(", ")}`}
          >
            {sources.map((s) => (
              <span
                key={s}
                title={SOURCE_LABEL[s] ?? s}
                role="img"
                aria-hidden="true"
              >
                {SOURCE_EMOJI[s] ?? "\uD83D\uDCCC"}
              </span>
            ))}
          </span>
        )}
      </div>

      {showIdeas && (
        <ul
          id={`ideas-${constellationIndex}`}
          className="mt-3 flex flex-col gap-1.5 rounded-lg border p-3"
          style={{
            background: "rgba(167,139,250,0.04)",
            borderColor: "rgba(167,139,250,0.18)",
          }}
        >
          {backingIdeas.map(({ id, idea }) => {
            const row = (
              <div className="flex items-start gap-2">
                <span
                  className="text-[13px] leading-none flex-shrink-0 mt-0.5"
                  role="img"
                  aria-hidden="true"
                >
                  {SOURCE_EMOJI[idea.source] ?? "\uD83D\uDCCC"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-white/85 leading-snug">
                    {idea.title}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-white/35">
                    {SOURCE_LABEL[idea.source] ?? idea.source}
                  </div>
                </div>
              </div>
            );
            return (
              <li key={id}>
                {idea.url ? (
                  <a
                    href={idea.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded px-1 py-0.5 -mx-1 hover:bg-white/[0.04] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#C4B5FD]"
                  >
                    {row}
                  </a>
                ) : (
                  <div className="px-1 py-0.5 -mx-1">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href={href}
        className="mt-5 inline-flex items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4B5FD]"
        style={{
          background: "rgba(167,139,250,0.15)",
          color: "#C4B5FD",
          border: "1px solid rgba(167,139,250,0.3)",
        }}
        aria-label={`Explore connections for gap: ${title}`}
      >
        Explore connections
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </article>
  );
}
