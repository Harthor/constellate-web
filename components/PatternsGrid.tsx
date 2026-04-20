import Link from "next/link";

interface PatternDef {
  type: "chain" | "triangulation" | "convergence" | "spectrum";
  label: string;
  short: string;
  color: string;
  // Minimal SVG drawing of the pattern's topology.
  icon: React.ReactNode;
}

const patterns: PatternDef[] = [
  {
    type: "chain",
    label: "Chain",
    short: "A logical progression nobody designed on purpose.",
    color: "#FF6B6B",
    icon: (
      <svg viewBox="0 0 48 24" width="48" height="24" aria-hidden="true">
        <line x1="8" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.5" />
        <line x1="20" y1="12" x2="32" y2="12" stroke="currentColor" strokeWidth="1.5" />
        <line x1="32" y1="12" x2="44" y2="12" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="12" r="3.5" fill="currentColor" />
        <circle cx="20" cy="12" r="3.5" fill="currentColor" />
        <circle cx="32" cy="12" r="3.5" fill="currentColor" />
        <circle cx="44" cy="12" r="3.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    type: "triangulation",
    label: "Triangulation",
    short: "Three views of the same phenomenon from different angles.",
    color: "#4ECDC4",
    icon: (
      <svg viewBox="0 0 48 24" width="48" height="24" aria-hidden="true">
        <line x1="24" y1="4" x2="8" y2="20" stroke="currentColor" strokeWidth="1.5" />
        <line x1="24" y1="4" x2="40" y2="20" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1="20" x2="40" y2="20" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="24" cy="4" r="3.5" fill="currentColor" />
        <circle cx="8" cy="20" r="3.5" fill="currentColor" />
        <circle cx="40" cy="20" r="3.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    type: "convergence",
    label: "Convergence",
    short: "Distant domains pointing at the same problem.",
    color: "#FFD166",
    icon: (
      <svg viewBox="0 0 48 24" width="48" height="24" aria-hidden="true">
        <line x1="6" y1="4" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
        <line x1="6" y1="20" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
        <line x1="42" y1="4" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
        <line x1="42" y1="20" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6" cy="4" r="3" fill="currentColor" />
        <circle cx="6" cy="20" r="3" fill="currentColor" />
        <circle cx="42" cy="4" r="3" fill="currentColor" />
        <circle cx="42" cy="20" r="3" fill="currentColor" />
        <circle cx="24" cy="12" r="4" fill="currentColor" />
      </svg>
    ),
  },
  {
    type: "spectrum",
    label: "Spectrum",
    short: "Positions along a single axis of debate.",
    color: "#95E1D3",
    icon: (
      <svg viewBox="0 0 48 24" width="48" height="24" aria-hidden="true">
        <line x1="4" y1="12" x2="44" y2="12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
        <circle cx="6" cy="12" r="3" fill="currentColor" />
        <circle cx="18" cy="12" r="3" fill="currentColor" />
        <circle cx="30" cy="12" r="3" fill="currentColor" />
        <circle cx="42" cy="12" r="3" fill="currentColor" />
      </svg>
    ),
  },
];

export default function PatternsGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
      {patterns.map((p) => (
        <Link
          key={p.type}
          href={`/constellation-map?view=cards&type=${p.type}`}
          className="group flex flex-col gap-3 rounded-xl border p-5 text-left transition-colors hover:border-white/20"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{ color: p.color }}
            className="opacity-90 transition-transform group-hover:scale-105"
          >
            {p.icon}
          </div>
          <h3 className="text-sm font-semibold text-white">{p.label}</h3>
          <p className="flex-1 text-xs leading-relaxed text-white/55">
            {p.short}
          </p>
          <span className="text-xs text-white/40 transition-colors group-hover:text-[#8EDCE6]">
            See examples &rarr;
          </span>
        </Link>
      ))}
    </div>
  );
}
