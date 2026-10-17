"use client";

import { useMemo } from "react";
import { Background, Handle, MarkerType, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ConnectionView, MatchView } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Kind = "startup" | "investor" | "funding" | "partner" | "bridge";
type NodeData = { label: string; kind: Kind; fit?: number; onPath?: boolean };

const DOT: Record<Kind, string> = { startup: "", investor: "bg-tech", funding: "bg-impact", partner: "bg-business", bridge: "bg-gold" };
const EDGE: Record<Exclude<Kind, "startup" | "bridge">, string> = { investor: "#0891b2", funding: "#059669", partner: "#2563eb" };

function OppNode({ data }: NodeProps<Node<NodeData>>) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white px-3 py-2 text-[13px] shadow-sm",
        data.kind === "startup" && "border-navy bg-navy px-4 py-2.5 text-[15px] font-semibold text-white shadow-lg",
        data.kind === "bridge" && "border-dashed border-gold bg-gold-soft text-gold-ink",
        data.onPath && data.kind !== "startup" && data.kind !== "bridge" && "ring-2 ring-gold/70",
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-0!" />
      <Handle type="source" position={Position.Bottom} className="opacity-0!" />
      <div className="flex items-center gap-2 whitespace-nowrap">
        {data.kind !== "startup" && <span className={cn("size-2 rounded-full", DOT[data.kind])} />}
        <span className="max-w-[180px] truncate font-medium">{data.label}</span>
        {data.fit != null && <span className="tabular text-muted-foreground">{Math.round(data.fit * 100)}%</span>}
      </div>
    </div>
  );
}

const nodeTypes = { opp: OppNode };
const ARCS: Record<"investor" | "funding" | "partner", [number, number]> = { investor: [-165, -15], funding: [135, 225], partner: [-35, 85] };

export function Constellation({ startupName, matches, connections }: { startupName: string; matches: MatchView[]; connections: ConnectionView[] }) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node<NodeData>[] = [];
    const edges: Edge[] = [];
    // Show only the strongest warm path in the graph to keep it readable; all paths are listed under Hidden connections.
    const warm = connections.filter((c) => c.kind === "warm_path").slice(0, 1);
    const pathKeys = new Set(warm.flatMap((w) => ((w.payload.hops as { key: string }[]) ?? []).map((h) => h.key)));
    nodes.push({ id: "startup", type: "opp", position: { x: 0, y: 0 }, data: { label: startupName, kind: "startup" }, draggable: false });

    for (const type of ["investor", "funding", "partner"] as const) {
      const list = matches.filter((m) => m.targetType === type).slice(0, 6);
      const [a0, a1] = ARCS[type];
      list.forEach((m, i) => {
        const t = list.length === 1 ? 0.5 : i / (list.length - 1);
        const ang = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
        const r = 250 + (1 - m.fit) * 280;
        const id = `${type}:${m.targetId}`;
        nodes.push({
          id, type: "opp", position: { x: Math.round(Math.cos(ang) * r * 1.55), y: Math.round(Math.sin(ang) * r) },
          data: { label: (m.target as { name: string }).name.replace(/\s*\(.*\)$/, ""), kind: type, fit: m.fit, onPath: pathKeys.has(id) },
        });
        edges.push({ id: `e-${id}`, type: "straight", source: "startup", target: id, style: { stroke: EDGE[type], strokeOpacity: 0.2 + m.fit * 0.4, strokeWidth: 1 + m.fit * 2 } });
      });
    }

    warm.forEach((w, wi) => {
      const hops = (w.payload.hops as { key: string; name: string }[]) ?? [];
      hops.forEach((h, i) => {
        if (i === 0) return;
        if (!nodes.find((n) => n.id === h.key)) {
          const target = nodes.find((n) => n.id === hops[hops.length - 1].key);
          const base = target?.position ?? { x: 0, y: -400 };
          const f = i / hops.length; // place bridges along the line to the target, nudged sideways
          const len = Math.hypot(base.x, base.y) || 1;
          nodes.push({
            id: h.key, type: "opp",
            position: { x: Math.round(base.x * f + (-base.y / len) * 70), y: Math.round(base.y * f + (base.x / len) * 70) },
            data: { label: h.name.replace(/\s*\(.*\)$/, ""), kind: "bridge", onPath: true },
          });
        }
        edges.push({
          id: `w-${wi}-${i}`, type: "straight", source: i === 1 ? "startup" : hops[i - 1].key, target: h.key, animated: true,
          style: { stroke: "#dfae32", strokeWidth: 2.2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#dfae32" },
        });
      });
    });
    return { nodes, edges };
  }, [startupName, matches, connections]);

  return (
    <div className="card-surface relative h-[560px] overflow-hidden bg-[#fcfcfd]">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.15 }} proOptions={{ hideAttribution: true }} nodesConnectable={false} minZoom={0.3}>
        <Background color="#d4d4d8" gap={24} size={1} />
      </ReactFlow>
      <div className="pointer-events-none absolute bottom-4 left-5 flex flex-wrap gap-5 text-sm text-muted-foreground">
        <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-tech" /> Investors</span>
        <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-impact" /> Grants & funding</span>
        <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-business" /> Partners & clients</span>
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-gold" /> Warm intro path</span>
      </div>
    </div>
  );
}
