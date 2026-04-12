"use client";

import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <span className="text-white/40 text-sm font-mono">Loading graph...</span>
    </div>
  ),
});

export default ForceGraph2D;
