import Link from "next/link";
import type { PipelineData } from "@/lib/types";
import WaitlistForm from "@/components/WaitlistForm";
import AbsenceCard from "@/components/AbsenceCard";
import Header from "@/components/Header";
import PatternsGrid from "@/components/PatternsGrid";
import ScrollFlash from "@/components/ScrollFlash";

const sources = [
  "Hacker News",
  "arXiv",
  "Y Combinator",
  "Product Hunt",
  "GitHub Trending",
  "Hugging Face",
  "Dev.to",
  "BetaList",
  "Papers With Code",
];

async function getData(): Promise<PipelineData | null> {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "public", "data.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function Home() {
  const data = await getData();

  // Keep the global index alongside each absence so deep links to the map
  // can target a specific constellation (neighborhood_hash is not unique —
  // several constellations can share the same neighborhood).
  const absences = data
    ? data.constellations
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => c.constellation_type === "absence")
        .sort((a, b) => b.c.score - a.c.score)
        .slice(0, 12)
    : [];

  const absenceCount = data?.metadata.constellations_by_type?.absence ?? absences.length;
  const totalIdeas = data?.metadata.total_ideas ?? 0;
  const runCost = data?.metadata.estimated_cost_usd ?? 0;
  const sourceCount = sources.length;

  return (
    <main className="relative">
      <ScrollFlash />
      <Header currentPath="/" />

      {/* Hero */}
      <section className="flex flex-col px-6 pb-20 pt-16">
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Don&apos;t know what to build?
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            Every week, Claude reads tech ideas from {sourceCount}{" "}
            feeds and finds what&apos;s{" "}
            <em className="not-italic" style={{ color: "#C4B5FD" }}>missing</em> —
            real gaps where something could exist but doesn&apos;t.
          </p>

          <dl className="mt-10 grid w-full max-w-2xl grid-cols-3 gap-3">
            {[
              { value: absenceCount.toString(), label: "gaps this week", accent: "#C4B5FD" },
              { value: totalIdeas.toString(), label: "ideas analyzed", accent: "#8EDCE6" },
              { value: `$${runCost.toFixed(2)}`, label: "to run", accent: "#95E1D3" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border px-4 py-4 text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                <dt className="sr-only">{s.label}</dt>
                <dd
                  className="font-mono text-3xl font-bold leading-none sm:text-4xl"
                  style={{ color: s.accent }}
                >
                  {s.value}
                </dd>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/45">
                  {s.label}
                </div>
              </div>
            ))}
          </dl>

          <a
            href="#top-gaps"
            className="mt-10 rounded-lg px-8 py-3.5 text-sm font-semibold transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C4B5FD]"
            style={{
              background: "rgba(167,139,250,0.35)",
              color: "#ffffff",
              border: "1px solid rgba(167,139,250,0.5)",
              boxShadow: "0 0 24px rgba(167,139,250,0.18)",
            }}
          >
            See this week&apos;s gaps &darr;
          </a>

          <div className="mt-8 flex flex-col items-center gap-3 w-full">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Or get them in your inbox
            </p>
            <WaitlistForm variant="landing" />
          </div>
        </div>
      </section>

      {/* Top Gaps */}
      {absences.length > 0 && (
        <section
          id="top-gaps"
          className="scroll-mt-6 bg-white/[0.01] px-6 py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-start gap-2">
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#C4B5FD" }}
              >
                Top Gaps &mdash; this week
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Where something could exist but doesn&apos;t
              </h2>
              <p className="mt-1 text-base text-white/50">
                {absences.length} gaps detected this week across{" "}
                {data?.metadata.total_ideas} ideas. Each gap is a real pattern
                of absence — a logical piece the community keeps circling
                without naming.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {absences.map(({ c, i }, idx) => (
                <AbsenceCard
                  key={i}
                  absence={c}
                  ideas={data!.ideas}
                  constellationIndex={i}
                  isFlashTarget={idx === 0}
                />
              ))}
            </div>

            <div className="mt-14 text-center">
              <Link
                href="/constellation-map?view=cards&type=absence"
                className="rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
                style={{
                  background: "rgba(142,220,230,0.15)",
                  color: "#8EDCE6",
                  border: "1px solid rgba(142,220,230,0.25)",
                }}
              >
                Explore full constellation map &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How it works
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8">
            {[
              {
                n: "1",
                title: "We read 9 tech feeds every week",
                desc: "Hacker News, arXiv, GitHub Trending, Y Combinator, Product Hunt, Hugging Face, Dev.to, BetaList, Papers With Code. You never have to add a source.",
              },
              {
                n: "2",
                title: "Claude clusters and reasons over groups",
                desc: "Instead of comparing items in pairs, Constellate asks Claude to look at groups of 3-6 ideas and find what they collectively imply.",
              },
              {
                n: "3",
                title: "Absences surface as real gaps",
                desc: "When a group of ideas keeps circling a problem without anyone naming the missing piece, that piece shows up here — as something you could build.",
              },
            ].map((step, i) => (
              <div key={i} className="flex flex-col">
                <span className="font-mono text-4xl font-bold" style={{ color: "rgba(167,139,250,0.4)" }}>
                  {step.n}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other patterns */}
      <section id="patterns" className="scroll-mt-20 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              We also find other patterns
            </h2>
            <p className="mt-4 text-base text-white/55">
              Absences are our headline output, but Claude surfaces four more
              kinds of pattern across the same feeds.
            </p>
          </div>

          <div className="mt-12">
            <PatternsGrid />
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/constellation-map?view=cards&type=absence"
              className="inline-block rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
              style={{
                background: "rgba(142,220,230,0.12)",
                color: "#8EDCE6",
                border: "1px solid rgba(142,220,230,0.22)",
              }}
            >
              Explore full constellation map &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Get weekly gaps in your inbox
          </h2>
          <p className="mt-4 text-base text-white/55">
            One email a week with the strongest gaps. Free until launch.
          </p>
          <div className="mt-8">
            <WaitlistForm variant="landing" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 pb-12 pt-8 text-center text-xs text-white/30">
        Constellate &mdash; built by{" "}
        <a
          href="https://github.com/Harthor"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 decoration-white/30 hover:decoration-[#8EDCE6] hover:text-[#8EDCE6] transition-colors"
        >
          Harthor
        </a>
        . &copy; 2026. Source-available under{" "}
        <a
          href="https://github.com/Harthor/constellate-engine"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 decoration-white/30 hover:decoration-[#8EDCE6] hover:text-[#8EDCE6] transition-colors"
        >
          BSL 1.1
        </a>
        .
      </footer>
    </main>
  );
}
