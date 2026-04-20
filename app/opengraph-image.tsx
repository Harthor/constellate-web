import { ImageResponse } from "next/og";
import type { PipelineData } from "@/lib/types";

// Runs at request time (not during build) so the numbers stay fresh whenever
// data.json changes. Cached upstream by Next.
export const alt = "Constellate — Find what's missing in tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function readData(): Promise<PipelineData | null> {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const p = path.join(process.cwd(), "public", "data.json");
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

export default async function OG() {
  const data = await readData();
  const absences = data?.metadata.constellations_by_type?.absence ?? 0;
  const ideas = data?.metadata.total_ideas ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          background:
            "linear-gradient(135deg, #0a0e1a 0%, #14102a 60%, #0a0e1a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top row: brand + badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            Constellate
          </div>
          <div
            style={{
              fontSize: 18,
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid rgba(167,139,250,0.35)",
              background: "rgba(167,139,250,0.12)",
              color: "#C4B5FD",
              fontFamily: "monospace",
              letterSpacing: "0.1em",
            }}
          >
            GAP FINDER · WEEKLY
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
            }}
          >
            Don&apos;t know what to build?
          </div>
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.3,
              color: "rgba(255,255,255,0.72)",
              maxWidth: 920,
            }}
          >
            Every week, Claude reads tech ideas from 9 feeds and surfaces
            what&apos;s missing.
          </div>
        </div>

        {/* Metric row */}
        <div style={{ display: "flex", gap: 48, alignItems: "flex-end" }}>
          <Stat value={absences.toString()} label="GAPS THIS WEEK" color="#C4B5FD" />
          <Stat value={ideas.toString()} label="IDEAS ANALYZED" color="#8EDCE6" />
          <Stat value="constellate.fyi" label="READ MORE" color="#95E1D3" small />
        </div>
      </div>
    ),
    { ...size },
  );
}

function Stat({
  value,
  label,
  color,
  small = false,
}: {
  value: string;
  label: string;
  color: string;
  small?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontSize: small ? 40 : 72,
          fontWeight: 700,
          color,
          fontFamily: "monospace",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 16,
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.45)",
          fontFamily: "monospace",
        }}
      >
        {label}
      </div>
    </div>
  );
}
