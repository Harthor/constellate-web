"use client";

import { useState } from "react";
import type { Constellation } from "@/lib/types";

interface EmailPreviewProps {
  /** Top absences to render as the email body. Pass 3. */
  sampleAbsences: Constellation[];
  /** Total absence count for the week, used in the subject line. */
  weekCount: number;
}

function cleanTitle(raw: string): string {
  return raw.replace(/^\s*missing\s*:\s*/i, "").trim();
}

export default function EmailPreview({ sampleAbsences, weekCount }: EmailPreviewProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto mt-6 w-full max-w-xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="email-preview-body"
        className="inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8EDCE6] rounded"
      >
        {open ? "Hide" : "See what you\u2019ll get"}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
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

      {open && (
        <div
          id="email-preview-body"
          className="mt-4 overflow-hidden rounded-lg border text-left"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          {/* Email meta header */}
          <div
            className="border-b px-4 py-3 text-[11px] font-mono text-white/60"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div>
              <span className="text-white/40">From:</span>{" "}
              <span className="text-white/80">Constellate</span>
            </div>
            <div className="mt-0.5">
              <span className="text-white/40">Subject:</span>{" "}
              <span className="text-white/90">
                This week: {weekCount} gaps in tech
              </span>
            </div>
            <div className="mt-0.5">
              <span className="text-white/40">Delivery:</span>{" "}
              <span className="text-white/60">Every Monday</span>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-4">
            <p className="text-xs text-white/55">
              Hi &mdash; here are the three strongest gaps Claude found across
              your feeds this week.
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {sampleAbsences.slice(0, 3).map((c) => (
                <li
                  key={c.neighborhood_hash + c.title}
                  className="border-l-2 pl-3"
                  style={{ borderColor: "#C4B5FD" }}
                >
                  <div className="text-[13px] font-semibold text-white">
                    {cleanTitle(c.title)}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-snug text-white/55 line-clamp-2">
                    {c.explanation}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[10px] text-white/30">
              Every Monday &middot; Unsubscribe anytime.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
