"use client";

import { useState, FormEvent } from "react";

interface WaitlistFormProps {
  variant?: "landing" | "floating";
}

export default function WaitlistForm({ variant = "landing" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "submitting") return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.status === 201 || res.status === 409) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

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
        {status === "success" ? (
          <p className="text-sm font-medium" style={{ color: "#8EDCE6" }}>
            You&apos;re in. See you Monday.
          </p>
        ) : (
          <>
            <p className="text-white text-sm font-semibold mb-0.5">Like what you see?</p>
            <p className="text-white/50 text-xs mb-3">Get the weekly digest, free until launch.</p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "submitting"}
                className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20"
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                className="px-3 py-1.5 rounded-md text-xs font-semibold flex-shrink-0 disabled:opacity-50"
                style={{ background: "#8EDCE6", color: "#0a0e1a" }}
              >
                {status === "submitting" ? "..." : "Join"}
              </button>
            </form>
            {status === "error" && (
              <p className="text-red-400 text-[10px] mt-1.5">Something went wrong. Try again.</p>
            )}
          </>
        )}
      </div>
    );
  }

  // Landing variant
  return (
    <div className="mx-auto w-full max-w-md">
      {status === "success" ? (
        <p className="text-center text-lg font-semibold" style={{ color: "#8EDCE6" }}>
          You&apos;re in. See you Monday.
        </p>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "submitting"}
              className="flex-1 min-w-0 px-4 py-3 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/25 transition-colors"
            />
            <button
              type="submit"
              disabled={status === "submitting"}
              className="px-5 py-3 rounded-lg text-sm font-semibold flex-shrink-0 disabled:opacity-50 transition-colors"
              style={{ background: "#8EDCE6", color: "#0a0e1a" }}
            >
              {status === "submitting" ? "Joining..." : "Join the waitlist"}
            </button>
          </form>
          {status === "error" && (
            <p className="text-red-400 text-xs mt-2 text-center">Something went wrong. Try again.</p>
          )}
        </>
      )}
    </div>
  );
}
