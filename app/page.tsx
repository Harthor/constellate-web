import Link from "next/link";
import type { PipelineData } from "@/lib/types";
import { SOURCE_EMOJI } from "@/lib/types";
import WaitlistForm from "@/components/WaitlistForm";

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
  const topConstellations = data
    ? [...data.constellations].sort((a, b) => b.score - a.score).slice(0, 3)
    : [];

  return (
    <main className="relative">
      {/* Hero */}
      <section className="flex flex-col px-6 pb-24 pt-8">
        <nav className="pb-6" aria-label="Main navigation">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Constellate
          </Link>
        </nav>

        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            The hidden patterns in what you&apos;re already reading.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Constellate watches Hacker News, arXiv, Y Combinator, Product Hunt,
            GitHub, Hugging Face, Dev.to and more. Every week, it surfaces
            constellations: groups of ideas that together reveal patterns no
            single source names out loud.
          </p>

          <Link
            href="/constellation-map"
            className="mt-10 rounded-lg px-8 py-3.5 text-sm font-semibold transition-all hover:brightness-110"
            style={{
              background: "rgba(142,220,230,0.35)",
              color: "#ffffff",
              border: "1px solid rgba(142,220,230,0.5)",
              boxShadow: "0 0 24px rgba(142,220,230,0.15)",
            }}
          >
            Explore the constellation map &rarr;
          </Link>
        </div>
      </section>

      {/* Featured constellations */}
      {topConstellations.length > 0 && (
        <section className="bg-white/[0.01] px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              This week&apos;s top constellations
            </h2>
            <p className="mt-3 text-base text-white/50">
              Real output from real sources. {data?.metadata.total_ideas} ideas
              analyzed, {data?.metadata.constellations_found} constellations found.
            </p>

            <div className="mt-12 flex flex-col gap-16">
              {topConstellations.map((c, i) => {
                const typeColors: Record<string, string> = {
                  chain: "#8EDCE6",
                  triangulation: "#4ECDC4",
                  convergence: "#FFD166",
                  absence: "#E6C46E",
                  spectrum: "#95E1D3",
                };
                const color = typeColors[c.constellation_type] || "#8EDCE6";

                return (
                  <article key={i}>
                    <span
                      className="inline-block rounded-sm px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest"
                      style={{
                        border: `1px solid ${color}40`,
                        background: `${color}10`,
                        color,
                      }}
                    >
                      {c.constellation_type}
                    </span>
                    <h3 className="mt-3 text-xl font-semibold leading-snug text-white sm:text-2xl">
                      {c.title}
                    </h3>
                    <p className="mt-2 font-mono text-xs text-white/40">
                      {c.idea_ids.length} ideas &middot; score {c.score}/10
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-base">
                      {c.explanation}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {c.idea_ids.map((id) => {
                        const idea = data?.ideas[id];
                        if (!idea) return null;
                        return (
                          <span
                            key={id}
                            className="rounded-md px-2.5 py-1.5 text-xs text-white/80 transition-colors hover:text-white hover:bg-white/[0.08] hover:border-white/20 flex items-center gap-1.5"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <span className="text-[11px]">{SOURCE_EMOJI[idea.source] || "\uD83D\uDCCC"}</span>
                            {idea.title}
                          </span>
                        );
                      })}
                    </div>

                    {i < topConstellations.length - 1 && (
                      <div className="mt-16 border-t border-white/[0.06]" />
                    )}
                  </article>
                );
              })}
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/constellation-map"
                className="rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
                style={{
                  background: "rgba(142,220,230,0.15)",
                  color: "#8EDCE6",
                  border: "1px solid rgba(142,220,230,0.25)",
                }}
              >
                See all {data?.metadata.constellations_found}{" "}constellations &rarr;
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
                title: "We watch the firehose",
                desc: "Constellate ingests new posts from 8 hand-picked sources every day. You never have to add a feed.",
              },
              {
                n: "2",
                title: "Claude reasons across groups",
                desc: "Instead of comparing items in pairs, Constellate asks Claude to find groups of 3-6 ideas that reveal chains, tensions, convergences, and missing pieces.",
              },
              {
                n: "3",
                title: "You get the signal, not the firehose",
                desc: "Every Monday, a short email with the week's strongest constellations. No feeds to manage. No infinite scroll.",
              },
            ].map((step, i) => (
              <div key={i} className="flex flex-col">
                <span className="font-mono text-4xl font-bold" style={{ color: "rgba(142,220,230,0.3)" }}>
                  {step.n}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sources */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            What Constellate watches
          </h2>
          <p className="mt-8 text-lg font-semibold leading-relaxed text-white/70">
            {sources.map((s, i) => (
              <span key={i}>
                {s}
                {i < sources.length - 1 && (
                  <span className="mx-2" style={{ color: "rgba(142,220,230,0.4)" }}>
                    &middot;
                  </span>
                )}
              </span>
            ))}
          </p>
          <p className="mt-4 text-sm text-white/40">
            Curated for people who read at the edge of tech, research and
            independent building.
          </p>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Join the waitlist
          </h2>
          <p className="mt-4 text-base text-white/50">
            Get weekly constellations in your inbox. Free until launch.
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
