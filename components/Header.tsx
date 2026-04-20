import Link from "next/link";

/**
 * Sticky header with blur backdrop + primary nav.
 * Used on the landing and the constellation map.
 *
 * Nav anchors (#top-gaps, #patterns) only resolve on the landing; on other
 * pages they degrade to `/#top-gaps` so clicking them from the map takes
 * the user home first.
 */
export default function Header({ currentPath = "/" }: { currentPath?: string }) {
  const anchor = (hash: string) => (currentPath === "/" ? hash : `/${hash}`);

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-3"
      style={{
        background: "rgba(10,14,26,0.72)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-base font-bold tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4B5FD]"
        >
          Constellate
        </Link>
        <a
          href="https://github.com/Harthor/constellate-engine"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wider uppercase transition-colors"
          style={{
            background: "rgba(167,139,250,0.08)",
            border: "1px solid rgba(167,139,250,0.22)",
            color: "#C4B5FD",
          }}
          title="Source-available under Business Source License 1.1"
        >
          Source-available · BSL 1.1
        </a>
      </div>

      <nav
        className="hidden items-center gap-5 md:flex"
        aria-label="Primary navigation"
      >
        <a
          href={anchor("#top-gaps")}
          className="text-sm text-white/60 transition-colors hover:text-white"
        >
          This week
        </a>
        <Link
          href="/constellation-map"
          className={
            "text-sm transition-colors " +
            (currentPath === "/constellation-map"
              ? "text-white"
              : "text-white/60 hover:text-white")
          }
        >
          Constellation map
        </Link>
        <a
          href={anchor("#patterns")}
          className="text-sm text-white/60 transition-colors hover:text-white"
        >
          Patterns
        </a>
        <a
          href="https://github.com/Harthor/constellate-engine"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
          aria-label="GitHub (opens in new tab)"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub
        </a>
      </nav>
    </header>
  );
}
