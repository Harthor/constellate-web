"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import ForceGraph2D from "@/components/ForceGraphWrapper";
import {
  TYPE_COLORS,
  TYPE_LABELS,
  TYPE_SHORT,
  SOURCE_EMOJI,
  type PipelineData,
  type Constellation,
} from "@/lib/types";
import WaitlistForm from "@/components/WaitlistForm";

interface GraphNode {
  id: string;
  title: string;
  type: string;
  score: number;
  idea_ids: number[];
  explanation: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
}

interface HubIdea {
  id: number;
  title: string;
  source: string;
  constellations: string[];
  count: number;
}

const TYPE_EXAMPLES: Record<string, string> = {
  chain: "Proprietary product \u2192 open-source clones \u2192 cheaper alternatives \u2192 users migrating.",
  triangulation: "A post refusing apps + a data privacy scandal + AI agent sandboxes \u2192 the silent collapse of user agency.",
  convergence: "A distributed systems paper + an organizational resilience article \u2192 both describing fault tolerance under stress.",
  absence: "AI coding agents + audit tools + regulation concerns, but no standardized logging for agent decisions.",
  spectrum: "From fully autonomous AI to fully supervised AI, with intermediate positions along the control spectrum.",
};

const TYPE_ORDER = ["chain", "triangulation", "convergence", "absence", "spectrum"] as const;

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "\u2026" : str;
}

export default function ConstellationMapPage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightedHub, setHighlightedHub] = useState<HubIdea | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(Object.keys(TYPE_COLORS)));
  const [minScore, setMinScore] = useState(6);
  const [searchText, setSearchText] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [viewMode, setViewMode] = useState<"graph" | "cards">("cards");
  const [sortOrder, setSortOrder] = useState<"score-desc" | "score-asc" | "type" | "alpha">("score-desc");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [ctaDismissed, setCtaDismissed] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const graphRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const drawnLabelsRef = useRef<Array<{ x: number; y: number; w: number; h: number }>>([]);
  const lastFrameRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem("constellate_view_mode");
    if (saved === "graph" || saved === "cards") setViewMode(saved);
    if (localStorage.getItem("constellate_cta_dismissed") === "1") setCtaDismissed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("constellate_view_mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    fetch("/data.json")
      .then((r) => r.json())
      .then((d: PipelineData) => { setData(d); setLoading(false); });
  }, []);

  // Deep link: ?c=<index> preselects a constellation; ?type=<kind> restricts
  // the type filter to a single pattern (used by the landing "Patterns" grid).
  // Also accepts ?highlight=<hash> for backwards compatibility.
  useEffect(() => {
    if (!data) return;
    const params = new URLSearchParams(window.location.search);

    // View mode override from the landing links ("?view=cards"). Only
    // applied when the caller explicitly asked for it — direct URL visits
    // fall back to the user's last-used mode from localStorage.
    const viewParam = params.get("view");
    if (viewParam === "cards" || viewParam === "graph") {
      setViewMode(viewParam);
    }

    // Single-type filter from the patterns grid on the landing.
    const typeParam = params.get("type");
    if (typeParam && TYPE_COLORS[typeParam]) {
      setActiveTypes(new Set([typeParam]));
    }

    let idx = -1;
    const cParam = params.get("c");
    if (cParam !== null) {
      const parsed = parseInt(cParam, 10);
      if (Number.isFinite(parsed) && parsed >= 0 && parsed < data.constellations.length) {
        idx = parsed;
      }
    }
    if (idx === -1) {
      const hash = params.get("highlight");
      if (hash) idx = data.constellations.findIndex((c) => c.neighborhood_hash === hash);
    }
    if (idx === -1) return;
    const c = data.constellations[idx];
    const node: GraphNode = {
      id: `c_${idx}`,
      title: c.title,
      type: c.constellation_type,
      score: c.score,
      idea_ids: c.idea_ids,
      explanation: c.explanation,
    };
    // Ensure the type filter includes this constellation's type, otherwise
    // the node is dimmed/hidden in the graph even though the panel opens.
    setActiveTypes((prev) => (prev.has(c.constellation_type) ? prev : new Set(prev).add(c.constellation_type)));
    // Drop the minScore threshold if this constellation wouldn't pass it.
    setMinScore((prev) => (c.score < prev ? c.score : prev));
    setSelectedNode(node);
  }, [data]);

  // Configure d3 forces for better spacing and auto-fit after settle
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg || !data || viewMode !== "graph") return;
    // Adaptive charge: high-degree nodes repel more to break dense clusters
    const degreeMap = new Map<string, number>();
    const consts = data.constellations;
    for (let i = 0; i < consts.length; i++) {
      const setA = new Set(consts[i].idea_ids);
      for (let j = i + 1; j < consts.length; j++) {
        if (consts[j].idea_ids.some(id => setA.has(id))) {
          const nI = `c_${i}`, nJ = `c_${j}`;
          degreeMap.set(nI, (degreeMap.get(nI) || 0) + 1);
          degreeMap.set(nJ, (degreeMap.get(nJ) || 0) + 1);
        }
      }
    }
    fg.d3Force("charge")?.strength((node: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const degree = degreeMap.get(node.id) || 0;
      return -60 - degree * 15;
    });
    fg.d3Force("link")?.distance(110);
    // Collision force: minimum distance between node centers
    // Access forceCollide from the same d3 bundle react-force-graph uses
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const d3 = require("d3-force-3d");
    fg.d3Force("collide", d3.forceCollide().radius(35).strength(0.8).iterations(3));
    fg.d3ReheatSimulation();
    const timer = setTimeout(() => { fg.zoomToFit(400, 45); }, 2500);
    return () => clearTimeout(timer);
  }, [data, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleType = useCallback((type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }, []);

  // Build graph nodes & links from constellations
  const { graphNodes, graphLinks } = useMemo(() => {
    if (!data) return { graphNodes: [], graphLinks: [] };
    const nodes: GraphNode[] = data.constellations.map((c, i) => ({
      id: `c_${i}`,
      title: c.title,
      type: c.constellation_type,
      score: c.score,
      idea_ids: c.idea_ids,
      explanation: c.explanation,
    }));

    const links: GraphLink[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const setA = new Set(nodes[i].idea_ids);
      for (let j = i + 1; j < nodes.length; j++) {
        const shared = nodes[j].idea_ids.filter((id) => setA.has(id));
        if (shared.length > 0) {
          links.push({ source: nodes[i].id, target: nodes[j].id, weight: shared.length });
        }
      }
    }
    return { graphNodes: nodes, graphLinks: links };
  }, [data]);

  // Filtered graph
  const filteredData = useMemo(() => {
    const sl = searchText.toLowerCase();
    const nodes = graphNodes.filter(
      (n) => activeTypes.has(n.type) && n.score >= minScore &&
        (searchText === "" || n.title.toLowerCase().includes(sl))
    );
    const ids = new Set(nodes.map((n) => n.id));
    const links = graphLinks.filter((l) => {
      const sId = typeof l.source === "string" ? l.source : l.source.id;
      const tId = typeof l.target === "string" ? l.target : l.target.id;
      return ids.has(sId) && ids.has(tId);
    });
    return { nodes: nodes.map((n) => ({ ...n })), links: links.map((l) => ({ ...l })) };
  }, [graphNodes, graphLinks, activeTypes, minScore, searchText]);

  // Hub ideas
  const hubIdeas = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, string[]>();
    graphNodes.forEach((n) => {
      n.idea_ids.forEach((id) => {
        if (!map.has(id)) map.set(id, []);
        map.get(id)!.push(n.id);
      });
    });
    return [...map.entries()]
      .filter(([, c]) => c.length >= 3)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 15)
      .map(([id, cIds]) => {
        const idea = data.ideas[id];
        return { id, title: idea?.title || `ID:${id}`, source: idea?.source || "?", constellations: cIds, count: cIds.length };
      });
  }, [data, graphNodes]);

  // IDs highlighted in the graph: either a hub's constellations (sidebar)
  // or the selected constellation + its directly connected siblings (those
  // that share at least one idea with it). This gives a focused "cluster"
  // view when opening via deep link or clicking a node.
  // When a selection is made (manually or via deep link), pan+zoom the
  // graph to focus on the related cluster. Respects prefers-reduced-motion.
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg || !selectedNode || viewMode !== "graph") return;
    // Let the d3 simulation place the nodes before measuring.
    const t = setTimeout(() => {
      const nodes = (fg.graphData?.().nodes ?? []) as Array<GraphNode & { x?: number; y?: number }>;
      const selectedIdeaIds = new Set(selectedNode.idea_ids);
      const cluster = nodes.filter((n) => {
        if (n.id === selectedNode.id) return true;
        return n.idea_ids.some((id) => selectedIdeaIds.has(id));
      });
      if (cluster.length === 0) return;
      const xs = cluster.map((n) => n.x ?? 0);
      const ys = cluster.map((n) => n.y ?? 0);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const w = Math.max(1, Math.max(...xs) - Math.min(...xs));
      const h = Math.max(1, Math.max(...ys) - Math.min(...ys));
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const dur = reduceMotion ? 0 : 650;
      // Heuristic zoom level: smaller cluster → higher zoom.
      const k = Math.max(0.8, Math.min(3.0, 320 / Math.max(w, h, 120)));
      try {
        fg.centerAt(cx, cy, dur);
        fg.zoom(k, dur);
      } catch {
        // Graph not fully initialised yet — give up silently.
      }
    }, 300);
    return () => clearTimeout(t);
  }, [selectedNode, viewMode]);

  // When in Cards view and a constellation is selected (typically via
  // deep link), scroll the matching card into view so the user can see
  // what they clicked. The ring-flash animation on the card provides
  // the visual confirmation.
  useEffect(() => {
    if (!selectedNode || viewMode !== "cards") return;
    // Give React a tick to render the selected-card styles + id.
    const t = setTimeout(() => {
      const el = document.getElementById(`card-${selectedNode.id}`);
      if (!el) return;
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    }, 120);
    return () => clearTimeout(t);
  }, [selectedNode, viewMode]);

  const highlightedNodeIds = useMemo(() => {
    if (highlightedHub) return new Set(highlightedHub.constellations);
    if (!selectedNode) return null;
    const related = new Set<string>([selectedNode.id]);
    const selectedIdeaIds = new Set(selectedNode.idea_ids);
    for (const n of graphNodes) {
      if (n.id === selectedNode.id) continue;
      if (n.idea_ids.some((id) => selectedIdeaIds.has(id))) {
        related.add(n.id);
      }
    }
    return related;
  }, [highlightedHub, selectedNode, graphNodes]);

  const hubIdeaIdSet = useMemo(() => new Set(hubIdeas.map((h) => h.id)), [hubIdeas]);

  // Sorted cards for card view
  const sortedCards = useMemo(() => {
    const cards = [...filteredData.nodes];
    switch (sortOrder) {
      case "score-desc": return cards.sort((a, b) => b.score - a.score);
      case "score-asc": return cards.sort((a, b) => a.score - b.score);
      case "type": return cards.sort((a, b) => a.type.localeCompare(b.type) || b.score - a.score);
      case "alpha": return cards.sort((a, b) => a.title.localeCompare(b.title));
      default: return cards;
    }
  }, [filteredData.nodes, sortOrder]);

  // Canvas renderers
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const n = node as GraphNode;
      const color = TYPE_COLORS[n.type] || "#888";
      const radius = 6 + (n.score - 6) * 2;
      const dimmed = highlightedNodeIds && !highlightedNodeIds.has(n.id);
      const isSelected = selectedNode?.id === n.id;
      ctx.globalAlpha = dimmed ? 0.12 : 1;

      // Pulse halo around the currently selected node (deep-link or click).
      // Sin animación si prefers-reduced-motion, pero el halo estático queda.
      if (isSelected) {
        const t = (performance.now() % 1800) / 1800; // 0..1 loop
        const pulseRadius = radius + 10 + Math.sin(t * Math.PI * 2) * 4;
        const pulseAlpha = 0.45 + Math.cos(t * Math.PI * 2) * 0.2;
        ctx.save();
        ctx.globalAlpha = pulseAlpha;
        ctx.beginPath();
        ctx.arc(n.x!, n.y!, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "#FF9E5E";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }

      if (n.score >= 9) {
        ctx.beginPath(); ctx.arc(n.x!, n.y!, radius + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff"; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(n.x!, n.y!, radius, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();

      // Reset occlusion tracking each frame (first node drawn clears it)
      const frameId = Math.round(performance.now() / 16);
      if (frameId !== lastFrameRef.current) {
        lastFrameRef.current = frameId;
        drawnLabelsRef.current = [];
      }

      // Show labels progressively based on zoom level
      const isHovered = hoveredNode?.id === n.id;
      const showLabel = isHovered ||
        (n.score >= 8 && globalScale > 0.4) ||
        (n.score >= 7 && globalScale > 1.2) ||
        (globalScale > 2.0);
      if (showLabel) {
        const label = truncate(n.title, globalScale > 1.5 ? 50 : 35);
        const fontSize = Math.max(3.5, 11 / globalScale);
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        const metrics = ctx.measureText(label);
        const padX = 4 / globalScale;
        const padY = 2 / globalScale;
        const textY = n.y! + radius + 3;
        const bgX = n.x! - metrics.width / 2 - padX;
        const bgY = textY - padY;
        const bgW = metrics.width + padX * 2;
        const bgH = fontSize + padY * 2;

        // Occlusion check: skip if overlapping a previously drawn label (hovered always draws)
        if (!isHovered) {
          const overlaps = drawnLabelsRef.current.some(r =>
            bgX < r.x + r.w && bgX + bgW > r.x && bgY < r.y + r.h && bgY + bgH > r.y
          );
          if (overlaps) {
            ctx.globalAlpha = 1;
            return;
          }
        }
        drawnLabelsRef.current.push({ x: bgX, y: bgY, w: bgW, h: bgH });

        // Background pill
        const bgRadius = 3 / globalScale;
        ctx.beginPath();
        ctx.roundRect(bgX, bgY, bgW, bgH, bgRadius);
        ctx.fillStyle = dimmed ? "rgba(10,14,26,0.4)" : "rgba(10,14,26,0.85)";
        ctx.fill();
        // Label text
        const labelAlpha = isHovered || n.score >= 8 ? 0.9 : n.score >= 7 ? 0.7 : 0.55;
        ctx.fillStyle = dimmed ? "rgba(255,255,255,0.15)" : `rgba(255,255,255,${labelAlpha})`;
        ctx.fillText(label, n.x!, textY);
      }
      ctx.globalAlpha = 1;
    },
    [highlightedNodeIds, hoveredNode, selectedNode]
  );

  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const src = link.source as GraphNode;
      const tgt = link.target as GraphNode;
      if (typeof src === "string" || typeof tgt === "string") return;
      const w = link.weight as number;
      const opacity = Math.min(0.2 + (w - 1) * 0.2, 0.6);
      const width = Math.min(1 + (w - 1) * 0.8, 3);
      const dimmed = highlightedNodeIds && (!highlightedNodeIds.has(src.id) || !highlightedNodeIds.has(tgt.id));
      ctx.beginPath(); ctx.moveTo(src.x!, src.y!); ctx.lineTo(tgt.x!, tgt.y!);
      ctx.strokeStyle = dimmed ? "rgba(142,220,230,0.04)" : `rgba(142,220,230,${opacity})`;
      ctx.lineWidth = width; ctx.stroke();
    },
    [highlightedNodeIds]
  );

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0a0e1a" }}>
        <span className="text-white/60 text-sm font-mono">Loading patterns...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={`fixed inset-0 ${viewMode === "graph" ? "overflow-hidden" : "overflow-auto"}`} style={{ background: "#0a0e1a" }} onMouseMove={viewMode === "graph" ? (e) => setTooltipPos({ x: e.clientX, y: e.clientY }) : undefined}>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-wrap items-center justify-between gap-2 min-h-[56px] px-4 sm:px-6 py-2" style={{ background: "rgba(10,14,26,0.82)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)" }}>
        <nav className="flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/" className="text-white font-bold text-sm hover:text-white/80 transition-colors">Constellate</Link>
          <span className="text-white/25 text-xs">&middot;</span>
          <h1 className="text-white/50 text-xs font-mono">Constellation Map</h1>
        </nav>
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 max-w-2xl items-center gap-3 text-center">
          <p className="text-white/50 text-[11px] font-mono leading-tight pointer-events-none">
            {filteredData.nodes.length} constellations from {data.metadata.total_ideas} ideas &middot; {Object.keys(TYPE_COLORS).length} types
          </p>
          <button onClick={() => setShowHelp(true)} className="text-white/60 hover:text-[#8EDCE6] text-xs font-mono whitespace-nowrap transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5" aria-label="Learn about constellation types">
            <span className="text-sm">&#9432;</span> What am I looking at?
          </button>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile help button */}
          <button onClick={() => setShowHelp(true)} className="lg:hidden text-white/50 hover:text-[#8EDCE6] text-xs transition-colors px-1.5 py-1 rounded-md hover:bg-white/5" aria-label="Learn about constellation types">
            <span className="text-sm">&#9432;</span>
          </button>
          {/* View toggle */}
          <div className="flex rounded-md overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => setViewMode("graph")}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-mono transition-colors flex items-center gap-1.5"
              style={{
                background: viewMode === "graph" ? "rgba(142,220,230,0.2)" : "transparent",
                color: viewMode === "graph" ? "#8EDCE6" : "rgba(255,255,255,0.5)",
              }}
              aria-label="Switch to graph view"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="3" cy="3" r="1.5" fill="currentColor"/><circle cx="11" cy="5" r="1.5" fill="currentColor"/><circle cx="5" cy="11" r="1.5" fill="currentColor"/><line x1="3" y1="3" x2="11" y2="5" stroke="currentColor" strokeWidth="0.8"/><line x1="3" y1="3" x2="5" y2="11" stroke="currentColor" strokeWidth="0.8"/></svg>
              <span className="hidden sm:inline">Graph</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-mono transition-colors flex items-center gap-1.5"
              style={{
                background: viewMode === "cards" ? "rgba(142,220,230,0.2)" : "transparent",
                color: viewMode === "cards" ? "#8EDCE6" : "rgba(255,255,255,0.5)",
                borderLeft: "1px solid rgba(255,255,255,0.1)",
              }}
              aria-label="Switch to card view"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1"/></svg>
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
          <Link href="/" className="hidden sm:inline-flex text-white/50 hover:text-white/80 text-xs transition-colors">
            &larr; Back
          </Link>
        </div>
      </header>

      {/* ═══ GRAPH VIEW ═══ */}
      {viewMode === "graph" && (
        <>
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData}
            nodeId="id"
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const radius = 6 + ((node as GraphNode).score - 6) * 2;
              ctx.beginPath(); ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
              ctx.fillStyle = color; ctx.fill();
            }}
            linkCanvasObject={linkCanvasObject}
            onNodeHover={(node: any) => setHoveredNode(node ? (node as GraphNode) : null)} // eslint-disable-line @typescript-eslint/no-explicit-any
            onNodeClick={(node: any) => { setSelectedNode(node as GraphNode); setHighlightedHub(null); }} // eslint-disable-line @typescript-eslint/no-explicit-any
            onBackgroundClick={() => { setSelectedNode(null); setHighlightedHub(null); }}
            backgroundColor="#0a0e1a"
            width={typeof window !== "undefined" ? window.innerWidth : 1200}
            height={typeof window !== "undefined" ? window.innerHeight : 800}
            cooldownTicks={100}
          />

          {/* Tooltip */}
          {hoveredNode && (
            <div className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg text-xs font-mono" style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 10, background: "rgba(10,14,26,0.92)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", maxWidth: 300 }}>
              <div className="font-semibold mb-1 text-white">{hoveredNode.title}</div>
              <div className="flex gap-3 text-white/60">
                <span style={{ color: TYPE_COLORS[hoveredNode.type] }}>{TYPE_LABELS[hoveredNode.type]}</span>
                <span>Score {hoveredNode.score}</span>
                <span>{hoveredNode.idea_ids.length} ideas</span>
              </div>
            </div>
          )}

          {/* Breadcrumb: when a constellation is selected (typically via deep link
              from a landing card), show where the user came from + what they're viewing. */}
          {selectedNode && (
            <div
              className="fixed top-[68px] left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 rounded-full text-xs font-mono"
              style={{
                background: "rgba(10,14,26,0.85)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                maxWidth: "90vw",
              }}
            >
              <Link
                href="/#top-gaps"
                className="text-white/50 hover:text-white/90 transition-colors flex-shrink-0"
              >
                &larr; Back to gaps
              </Link>
              <span className="text-white/20 flex-shrink-0">/</span>
              <span className="text-white/40 flex-shrink-0">Viewing:</span>
              <span
                className="text-white/85 truncate"
                title={selectedNode.title}
              >
                {selectedNode.title}
              </span>
            </div>
          )}

          {/* Right panel — detail */}
          {selectedNode && (
            <div className="fixed top-[60px] right-4 bottom-20 w-96 z-40 overflow-y-auto rounded-xl p-5 flex flex-col gap-4" style={{ background: "rgba(10,14,26,0.9)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}>
              <button onClick={() => setSelectedNode(null)} className="absolute top-3 right-3 text-white/30 hover:text-white/60 text-lg">&times;</button>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold" style={{ background: TYPE_COLORS[selectedNode.type], color: "#0a0e1a" }}>{TYPE_LABELS[selectedNode.type]}</span>
                <span className="text-white/50 text-xs font-mono">Score {selectedNode.score}</span>
              </div>
              <p className="text-white/50 text-[12px] italic leading-snug -mt-2">{TYPE_SHORT[selectedNode.type]}</p>
              <h2 className="text-white text-base font-semibold leading-snug">{selectedNode.title}</h2>
              <p className="text-white/60 text-xs leading-relaxed">{selectedNode.explanation}</p>
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-2">Ideas ({selectedNode.idea_ids.length})</h4>
                <div className="flex flex-col gap-1.5">
                  {Array.from(new Set(selectedNode.idea_ids)).map((ideaId) => {
                    const idea = data.ideas[ideaId];
                    if (!idea) return null;
                    const isHub = hubIdeaIdSet.has(ideaId);
                    return idea.url ? (
                        <a key={ideaId} href={idea.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer">
                          <span className="text-sm flex-shrink-0 mt-0.5">{SOURCE_EMOJI[idea.source] || "\uD83D\uDCCC"}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-white/80 leading-tight group-hover:text-[#8EDCE6] transition-colors">{idea.title}{isHub && <span className="ml-1.5 text-yellow-400" title="Hub idea: appears in 3+ constellations">&#11088;</span>}</div>
                            <div className="text-[10px] text-white/30">{idea.source}</div>
                          </div>
                        </a>
                    ) : (
                        <div key={ideaId} className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                          <span className="text-sm flex-shrink-0 mt-0.5">{SOURCE_EMOJI[idea.source] || "\uD83D\uDCCC"}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-white/80 leading-tight">{idea.title}{isHub && <span className="ml-1.5 text-yellow-400" title="Hub idea: appears in 3+ constellations">&#11088;</span>}</div>
                            <div className="text-[10px] text-white/30">{idea.source}</div>
                          </div>
                        </div>
                      )
                    ;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="fixed top-[60px] z-30 flex gap-3 px-4 py-2 rounded-lg" style={{ right: selectedNode ? "26rem" : "1rem", background: "rgba(10,14,26,0.8)", border: "1px solid rgba(255,255,255,0.06)", transition: "right 0.2s" }}>
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-white/50">{TYPE_LABELS[type]}</span>
              </div>
            ))}
          </div>

          {/* Bottom stats */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-6 py-2.5 rounded-full text-xs font-mono text-white/40 text-center" style={{ background: "rgba(10,14,26,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {filteredData.nodes.length} constellations &middot; {Object.keys(TYPE_COLORS).length} types &middot; {filteredData.links.length} edges &middot;{" "}
            <span
              className="cursor-help underline decoration-dotted decoration-white/30 underline-offset-2"
              title="Hub ideas are ideas that appear in 3+ constellations — they connect multiple patterns."
            >
              {hubIdeas.length} hub ideas
            </span>
          </div>
        </>
      )}

      {/* ═══ CARDS VIEW ═══ */}
      {viewMode === "cards" && (
        <div className="absolute inset-0 top-14 overflow-y-auto px-4 pb-32 sm:px-6 lg:px-8" style={{ background: "#0a0e1a" }}>
          {/* Toolbar */}
          <div className="sticky top-0 z-20 flex flex-col gap-3 py-4" style={{ background: "#0a0e1a" }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-white/40">
                Showing {sortedCards.length} of {graphNodes.length} constellations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(TYPE_COLORS).map(([type, color]) => (
                  <button key={type} onClick={() => toggleType(type)} className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors" style={{ background: activeTypes.has(type) ? `${color}20` : "transparent", color: activeTypes.has(type) ? color : "rgba(255,255,255,0.35)", border: `1px solid ${activeTypes.has(type) ? `${color}40` : "rgba(255,255,255,0.08)"}` }} aria-label={`Filter ${TYPE_LABELS[type]}`}>
                    <span className="w-2 h-2 rounded-full" style={{ background: color, opacity: activeTypes.has(type) ? 1 : 0.3 }} />
                    {TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <input type="text" placeholder="Search..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full sm:w-40 px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/25" aria-label="Search constellations" />
              <div className="flex items-center gap-1.5">
                <label htmlFor="score-slider-cards" className="text-xs text-white/30 font-mono">Score &ge; {minScore}</label>
                <input id="score-slider-cards" type="range" min={6} max={10} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-20 accent-white/60" aria-label="Minimum score filter" />
              </div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="px-2 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white/70 outline-none cursor-pointer"
                aria-label="Sort order"
              >
                <option value="score-desc">Score (high to low)</option>
                <option value="score-asc">Score (low to high)</option>
                <option value="type">Type</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedCards.map((node) => {
              const isExpanded = expandedCards.has(node.id);
              const isSelected = selectedNode?.id === node.id;
              return (
                <article
                  key={node.id}
                  id={`card-${node.id}`}
                  className={
                    "rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:border-[#8EDCE6]/30" +
                    (isSelected ? " ring-flash" : "")
                  }
                  style={{
                    background: isSelected
                      ? "rgba(167,139,250,0.08)"
                      : "rgba(255,255,255,0.02)",
                    border: isSelected
                      ? "1px solid rgba(167,139,250,0.6)"
                      : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isSelected
                      ? "0 0 24px rgba(167,139,250,0.25)"
                      : "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  {/* Badge + score */}
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold" style={{ background: TYPE_COLORS[node.type], color: "#0a0e1a" }}>
                      {TYPE_LABELS[node.type]}
                    </span>
                    <span className="text-white/50 text-xs font-mono">Score {node.score}/10</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-white text-[15px] font-semibold leading-snug line-clamp-2">
                    {node.title}
                  </h3>

                  {/* Explanation */}
                  <div>
                    <p className={`text-white/70 text-[13px] leading-relaxed ${isExpanded ? "" : "line-clamp-4"}`}>
                      {node.explanation}
                    </p>
                    {node.explanation.length > 200 && (
                      <button
                        onClick={() => setExpandedCards((prev) => {
                          const next = new Set(prev);
                          if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
                          return next;
                        })}
                        className="text-[#8EDCE6] text-xs mt-1 hover:underline"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>

                  {/* Ideas */}
                  <div className="border-t border-white/[0.06] pt-3 flex flex-col gap-1.5">
                    {Array.from(new Set(node.idea_ids)).map((ideaId) => {
                      const idea = data.ideas[ideaId];
                      if (!idea) return null;
                      const isHub = hubIdeaIdSet.has(ideaId);
                      return idea.url ? (
                          <a
                            key={ideaId}
                            href={idea.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 px-2 py-1 rounded-md hover:bg-white/5 transition-colors group cursor-pointer"
                          >
                            <span className="text-xs flex-shrink-0 mt-0.5">{SOURCE_EMOJI[idea.source] || "\uD83D\uDCCC"}</span>
                            <span className="text-xs text-white/70 leading-tight group-hover:text-[#8EDCE6] transition-colors">
                              {idea.title}
                              {isHub && <span className="ml-1 text-yellow-400" title="Hub idea: appears in 3+ constellations">&#11088;</span>}
                              <span className="ml-1.5 text-white/30">{idea.source}</span>
                            </span>
                          </a>
                      ) : (
                          <div
                            key={ideaId}
                            className="flex items-start gap-2 px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
                          >
                            <span className="text-xs flex-shrink-0 mt-0.5">{SOURCE_EMOJI[idea.source] || "\uD83D\uDCCC"}</span>
                            <span className="text-xs text-white/70 leading-tight">
                              {idea.title}
                              {isHub && <span className="ml-1 text-yellow-400" title="Hub idea: appears in 3+ constellations">&#11088;</span>}
                              <span className="ml-1.5 text-white/30">{idea.source}</span>
                            </span>
                          </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Mobile toggle button for left panel (graph view only) ═══ */}
      {viewMode === "graph" && (
        <button
          onClick={() => setMobilePanelOpen(true)}
          className="md:hidden fixed top-[68px] left-3 z-50 flex items-center justify-center w-10 h-10 rounded-lg"
          style={{ background: "rgba(10,14,26,0.85)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(16px)" }}
          aria-label="Open filters panel"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
        </button>
      )}

      {/* ═══ Mobile backdrop ═══ */}
      {viewMode === "graph" && mobilePanelOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobilePanelOpen(false)}
        />
      )}

      {/* ═══ SHARED: Left panel (graph view only) ═══ */}
      {viewMode === "graph" && (
        <div className={`fixed top-[60px] left-4 bottom-20 w-80 z-50 overflow-y-auto rounded-xl p-4 flex flex-col gap-4 transition-transform duration-200 ${mobilePanelOpen ? "translate-x-0" : "-translate-x-[calc(100%+2rem)]"} md:translate-x-0`} style={{ background: "rgba(10,14,26,0.85)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}>
          <button
            onClick={() => setMobilePanelOpen(false)}
            className="md:hidden self-end -mt-1 -mr-1 w-7 h-7 flex items-center justify-center rounded-md text-white/50 hover:text-white/80 transition-colors"
            aria-label="Close filters panel"
          >
            &times;
          </button>
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-2">Filters</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <label key={type} className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input type="checkbox" checked={activeTypes.has(type)} onChange={() => toggleType(type)} className="sr-only" />
                  <span className="w-3 h-3 rounded-sm border" style={{ background: activeTypes.has(type) ? color : "transparent", borderColor: color }} />
                  <span className="text-white/70" style={{ color: activeTypes.has(type) ? color : undefined }}>{TYPE_LABELS[type]}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <label htmlFor="score-slider-graph" className="text-xs text-white/40 font-mono">Score &ge; {minScore}</label>
              <input id="score-slider-graph" type="range" min={6} max={10} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="flex-1 accent-white/60" aria-label="Minimum score filter" />
            </div>
            <input type="text" placeholder="Search by title..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/25" />
          </div>
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-0.5">Hub Ideas</h2>
            <p className="text-[10px] text-white/40 mb-3 leading-snug">
              Ideas that appear in 3+ constellations &mdash; they connect
              multiple patterns.
            </p>
            <div className="flex flex-col gap-1">
              {hubIdeas.map((hub) => (
                <button key={hub.id} onClick={() => { setHighlightedHub(highlightedHub?.id === hub.id ? null : hub); setSelectedNode(null); }} className="text-left px-2 py-1.5 rounded-lg transition-colors text-xs" style={{ background: highlightedHub?.id === hub.id ? "rgba(255,255,255,0.1)" : "transparent" }}>
                  <div className="text-white/80 leading-tight">{SOURCE_EMOJI[hub.source] || "\uD83D\uDCCC"} {truncate(hub.title, 50)}</div>
                  <div className="text-white/35 mt-0.5">{hub.source} &middot; in {hub.count} constellations</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating waitlist CTA */}
      {!ctaDismissed && (
        <div className="hidden sm:block fixed bottom-20 right-4 z-40 w-72">
          <div className="relative">
            <button
              onClick={() => { setCtaDismissed(true); localStorage.setItem("constellate_cta_dismissed", "1"); }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 text-xs transition-colors z-10"
              style={{ background: "rgba(10,14,26,0.9)", border: "1px solid rgba(255,255,255,0.15)" }}
              aria-label="Dismiss waitlist popup"
            >
              &times;
            </button>
            <WaitlistForm variant="floating" />
          </div>
        </div>
      )}

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-6 sm:p-8" style={{ background: "rgba(10,14,26,0.95)", border: "1px solid rgba(255,255,255,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-white/30 hover:text-white/60 text-lg">&times;</button>
            <h3 className="text-white text-lg font-semibold mb-2">The 5 types of constellations</h3>
            <p className="text-white/50 text-sm leading-relaxed mb-6">Constellate groups ideas into patterns of 3-6 items that reveal non-obvious connections. Each constellation falls into one of five categories:</p>
            <div className="flex flex-col gap-5">
              {TYPE_ORDER.map((type) => (
                <div key={type} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <TypeIcon type={type} />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold mb-1.5" style={{ background: TYPE_COLORS[type], color: "#0a0e1a" }}>{TYPE_LABELS[type]}</span>
                    <p className="text-white/70 text-sm leading-relaxed mb-1">{TYPE_SHORT[type]}</p>
                    <p className="text-white/40 text-xs italic leading-relaxed">Example: {TYPE_EXAMPLES[type]}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHelp(false)} className="mt-6 w-full py-2 rounded-lg text-sm font-semibold transition-colors" style={{ background: "rgba(142,220,230,0.15)", color: "#8EDCE6", border: "1px solid rgba(142,220,230,0.25)" }}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TypeIcon({ type }: { type: string }) {
  const color = TYPE_COLORS[type] || "#888";
  switch (type) {
    case "chain":
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
          <circle cx="8" cy="20" r="4" fill={color} /><line x1="12" y1="20" x2="22" y2="20" stroke={color} strokeWidth="1.5" />
          <circle cx="26" cy="20" r="4" fill={color} /><line x1="30" y1="20" x2="40" y2="20" stroke={color} strokeWidth="1.5" />
          <circle cx="44" cy="20" r="4" fill={color} /><line x1="48" y1="20" x2="52" y2="20" stroke={color} strokeWidth="1.5" />
          <circle cx="56" cy="20" r="3" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
          <polygon points="21,17 25,20 21,23" fill={color} /><polygon points="39,17 43,20 39,23" fill={color} />
        </svg>
      );
    case "triangulation":
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
          <line x1="32" y1="6" x2="10" y2="34" stroke={color} strokeWidth="1" opacity="0.5" />
          <line x1="32" y1="6" x2="54" y2="34" stroke={color} strokeWidth="1" opacity="0.5" />
          <line x1="10" y1="34" x2="54" y2="34" stroke={color} strokeWidth="1" opacity="0.5" />
          <circle cx="32" cy="6" r="4" fill={color} /><circle cx="10" cy="34" r="4" fill={color} /><circle cx="54" cy="34" r="4" fill={color} />
          <circle cx="32" cy="24" r="5" fill={color} opacity="0.15" /><circle cx="32" cy="24" r="2" fill={color} opacity="0.4" />
        </svg>
      );
    case "convergence":
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
          <line x1="10" y1="8" x2="27" y2="17" stroke={color} strokeWidth="1.5" />
          <line x1="54" y1="8" x2="37" y2="17" stroke={color} strokeWidth="1.5" />
          <line x1="10" y1="34" x2="27" y2="25" stroke={color} strokeWidth="1.5" />
          <line x1="54" y1="34" x2="37" y2="25" stroke={color} strokeWidth="1.5" />
          <circle cx="10" cy="8" r="3.5" fill={color} /><circle cx="54" cy="8" r="3.5" fill={color} />
          <circle cx="10" cy="34" r="3.5" fill={color} /><circle cx="54" cy="34" r="3.5" fill={color} />
          <circle cx="32" cy="20" r="6" fill={color} opacity="0.2" /><circle cx="32" cy="20" r="3" fill={color} />
        </svg>
      );
    case "absence":
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
          <circle cx="12" cy="14" r="4" fill={color} /><circle cx="52" cy="14" r="4" fill={color} />
          <circle cx="12" cy="30" r="4" fill={color} /><circle cx="52" cy="30" r="4" fill={color} />
          <line x1="12" y1="14" x2="52" y2="14" stroke={color} strokeWidth="1" opacity="0.3" />
          <line x1="12" y1="14" x2="12" y2="30" stroke={color} strokeWidth="1" opacity="0.3" />
          <line x1="12" y1="30" x2="52" y2="30" stroke={color} strokeWidth="1" opacity="0.3" />
          <line x1="52" y1="14" x2="52" y2="30" stroke={color} strokeWidth="1" opacity="0.3" />
          <circle cx="32" cy="22" r="6" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
          <text x="32" y="26" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">?</text>
        </svg>
      );
    case "spectrum":
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
          <line x1="6" y1="20" x2="58" y2="20" stroke={color} strokeWidth="1" opacity="0.3" />
          <circle cx="8" cy="20" r="4" fill={color} opacity="0.3" /><circle cx="22" cy="20" r="4" fill={color} opacity="0.5" />
          <circle cx="36" cy="20" r="4" fill={color} opacity="0.7" /><circle cx="50" cy="20" r="4" fill={color} />
          <path d="M3,20 L8,17 L8,23 Z" fill={color} opacity="0.3" /><path d="M61,20 L56,17 L56,23 Z" fill={color} />
        </svg>
      );
    default:
      return null;
  }
}
