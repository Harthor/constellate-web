interface UpdatesCtaProps {
  variant?: "landing" | "floating";
}

const WEB_REPOSITORY = "https://github.com/Harthor/constellate-web";

export default function UpdatesCta({ variant = "landing" }: UpdatesCtaProps) {
  if (variant === "floating") {
    return (
      <div
        className="rounded-xl p-4"
        style={{
          background: "rgba(10,14,26,0.9)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(16px)",
        }}
      >
        <p className="text-sm font-semibold text-white">Want future data releases?</p>
        <p className="mb-3 mt-0.5 text-xs text-white/50">
          Follow the open-source frontend on GitHub.
        </p>
        <a
          href={WEB_REPOSITORY}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-md px-3 py-1.5 text-xs font-semibold"
          style={{ background: "#8EDCE6", color: "#0a0e1a" }}
        >
          View repository
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <a
        href={WEB_REPOSITORY}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex rounded-lg px-5 py-3 text-sm font-semibold transition-colors hover:brightness-110"
        style={{ background: "#8EDCE6", color: "#0a0e1a" }}
      >
        Follow on GitHub
      </a>
      <p className="mt-3 text-xs text-white/40">
        Email updates are paused; the current dataset remains fully browsable.
      </p>
    </div>
  );
}
