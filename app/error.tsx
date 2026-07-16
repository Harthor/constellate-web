"use client";

export default function ErrorPage({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0e1a] px-6 text-center">
      <div className="max-w-lg rounded-xl border border-white/10 bg-white/[0.02] p-8">
        <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Constellate could not render this page. Your data has not been changed.
        </p>
        <button
          onClick={unstable_retry}
          className="mt-6 rounded-lg bg-[#8EDCE6] px-4 py-2 text-sm font-semibold text-[#0a0e1a]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
