import Link from "next/link";
import {
  parseSummaryData,
  parseTopGapsData,
  type SummaryData,
  type TopGapsData,
} from "@/lib/derived-data";
import UpdatesCta from "@/components/UpdatesCta";
import AbsenceCard from "@/components/AbsenceCard";
import Header from "@/components/Header";
import PatternsGrid from "@/components/PatternsGrid";
import ScrollFlash from "@/components/ScrollFlash";

async function getData(): Promise<{
  summary: SummaryData | null;
  topGaps: TopGapsData | null;
  error: string | null;
}> {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const dataDirectory = path.join(process.cwd(), "public", "data");
    const summary = parseSummaryData(
      JSON.parse(fs.readFileSync(path.join(dataDirectory, "summary.json"), "utf-8")),
    );
    const topGaps = parseTopGapsData(
      JSON.parse(fs.readFileSync(path.join(dataDirectory, "top-gaps.json"), "utf-8")),
    );
    if (summary.metadata.generated_at !== topGaps.metadata.generated_at) {
      throw new Error("Derived homepage files were generated from different snapshots");
    }
    return { summary, topGaps, error: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The derived data files could not be read.";
    if (process.env.NODE_ENV !== "production") {
      console.error(`[Constellate] Homepage data unavailable: ${message}`);
    }
    return {
      summary: null,
      topGaps: null,
      error: message,
    };
  }
}

export default async function Home() {
  const { summary, topGaps, error } = await getData();
  const absences = topGaps?.gaps ?? [];
  const absenceCount = summary?.metadata.constellations_by_type.absence;
  const totalIdeas = summary?.metadata.total_ideas;
  const sourceCount = summary?.sources.length;
  const sourcePhrase = sourceCount
    ? `${sourceCount} leading tech sources`
    : "leading tech sources";
  const latestAnalysis = summary
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(summary.metadata.generated_at))
    : null;

  return (
    <main className="relative">
      <ScrollFlash />
      <Header currentPath="/" />

      {/* Hero */}
      <section className="flex flex-col px-4 pb-20 pt-16 sm:px-6">
        <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-3xl flex-col items-center text-center">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Don&apos;t know what to build?
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            Constellate analyzes ideas from {sourcePhrase} and finds what&apos;s{" "}
            <em className="not-italic" style={{ color: "#C4B5FD" }}>missing</em>
            &mdash;real gaps where something could exist but doesn&apos;t.
          </p>

          <dl className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { value: absenceCount?.toLocaleString("en-US") ?? "—", label: "gaps detected", accent: "#C4B5FD" },
              { value: totalIdeas?.toLocaleString("en-US") ?? "—", label: "ideas analyzed", accent: "#8EDCE6" },
              { value: sourceCount?.toLocaleString("en-US") ?? "—", label: "sources", accent: "#95E1D3" },
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

          {latestAnalysis && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
              Latest analysis: {latestAnalysis}
            </p>
          )}

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
            See current gaps &darr;
          </a>

          <div className="mt-8 flex flex-col items-center gap-3 w-full">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Follow future releases
            </p>
            <UpdatesCta variant="landing" />
          </div>
        </div>
      </section>

      {error && (
        <section className="px-4 pb-12 sm:px-6" aria-live="polite">
          <div className="mx-auto max-w-3xl rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-6 text-center">
            <h2 className="text-lg font-semibold text-white">Pattern data is unavailable</h2>
            <p className="mt-2 text-sm text-white/60">
              The published dataset is missing or invalid. The site is still online,
              but there are no patterns to display right now.
            </p>
          </div>
        </section>
      )}

      {!error && summary?.metadata.constellations_found === 0 && (
        <section className="px-4 pb-12 sm:px-6" aria-live="polite">
          <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
            <h2 className="text-lg font-semibold text-white">No patterns published yet</h2>
            <p className="mt-2 text-sm text-white/60">
              The dataset is valid but empty. Check back after the next manual data publication.
            </p>
          </div>
        </section>
      )}

      {/* Top Gaps */}
      {absences.length > 0 && (
        <section
          id="top-gaps"
          className="scroll-mt-6 bg-white/[0.01] px-4 py-24 sm:px-6"
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-start gap-2">
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#C4B5FD" }}
              >
                Top Gaps &mdash; latest analysis
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Where something could exist but doesn&apos;t
              </h2>
              <p className="mt-1 text-base text-white/50">
                Showing the top {absences.length} of {absenceCount} gaps
                detected across {totalIdeas?.toLocaleString("en-US")} ideas.
                Each gap is a real pattern of absence — a logical piece the
                community keeps circling without naming.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {absences.map(({ absence, ideas, constellationIndex }, idx) => (
                <AbsenceCard
                  key={constellationIndex}
                  absence={absence}
                  ideas={ideas}
                  constellationIndex={constellationIndex}
                  isFlashTarget={idx === 0}
                />
              ))}
            </div>

            <div className="mt-14 text-center">
              <Link
                href="/constellation-map/?view=cards&type=absence"
                className="rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
                style={{
                  background: "rgba(142,220,230,0.15)",
                  color: "#8EDCE6",
                  border: "1px solid rgba(142,220,230,0.25)",
                }}
              >
                Browse all absences &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How it works
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8">
            {[
              {
                n: "1",
                title: sourceCount
                  ? `We analyze ${sourceCount} leading tech sources`
                  : "We analyze leading tech sources",
                desc: `${summary?.sources.join(", ") ?? "The configured technology feeds"}. You never have to add a source.`,
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
      <section id="patterns" className="scroll-mt-20 px-4 py-24 sm:px-6">
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
              href="/constellation-map/?view=cards&type=absence"
              className="inline-block rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
              style={{
                background: "rgba(142,220,230,0.12)",
                color: "#8EDCE6",
                border: "1px solid rgba(142,220,230,0.22)",
              }}
            >
              Browse all absences &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Updates */}
      <section id="updates" className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Follow the next data release
          </h2>
          <p className="mt-4 text-base text-white/55">
            The date above identifies the latest manually published snapshot.
            Follow the repository to see when the next verified release is available.
          </p>
          <div className="mt-8">
            <UpdatesCta variant="landing" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 pb-12 pt-8 sm:px-6 text-center text-xs text-white/30">
        Constellate &mdash; built by{" "}
        <a
          href="https://github.com/Harthor"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 decoration-white/30 hover:decoration-[#8EDCE6] hover:text-[#8EDCE6] transition-colors"
        >
          Harthor
        </a>
        . &copy; 2026. Browse the{" "}
        <a
          href="https://github.com/Harthor/constellate-web"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 decoration-white/30 hover:decoration-[#8EDCE6] hover:text-[#8EDCE6] transition-colors"
        >
          frontend source
        </a>
        {" "}or the{" "}
        <a
          href="https://github.com/Harthor/constellate-engine"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 decoration-white/30 hover:decoration-[#8EDCE6] hover:text-[#8EDCE6] transition-colors"
        >
          BSL 1.1 engine
        </a>
        .
      </footer>
    </main>
  );
}
