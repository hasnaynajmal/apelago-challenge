"use client";

import { useMemo } from "react";
import { Background, Handle, MarkerType, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ConnectionView, MatchView } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Kind = "startup" | "investor" | "funding" | "partner" | "bridge";
type NodeData = { label: string; kind: Kind; fit?: number; sub?: string; top?: boolean; onPath?: boolean };

const STYLE: Record<Kind, string> = {
  startup: "border-gold bg-gold text-navy-900 font-bold px-4 py-2.5 text-sm shadow-[0_0_40px_-4px_#dfae32]",
  investor: "border-tech/50 bg-navy-700/90 text-ice",
  funding: "border-impact/50 bg-navy-700/90 text-ice",
  partner: "border-business/50 bg-navy-700/90 text-ice",
  bridge: "border-gold/60 border-dashed bg-navy-900/90 text-gold",
};
const DOT: Record<Kind, string> = { startup: "", investor: "bg-tech", funding: "bg-impact", partner: "bg-business", bridge: "bg-gold" };

function OppNode({ data }: NodeProps<Node<NodeData>>) {
  return (
    <div className={cn("rounded-xl border px-3 py-1.5 text-xs backdrop-blur", STYLE[data.kind], data.onPath && data.kind !== "startup" && "ring-2 ring-gold/70")}>
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {data.kind !== "startup" && <span className={cn("size-1.5 rounded-full", DOT[data.kind])} />}
        <span className="max-w-[170px] truncate font-medium">{data.label}</span>
        {data.fit != null && <span className="tabular text-[10px] text-muted-foreground">{Math.round(data.fit * 100)}%</span>}
      </div>
      {data.sub && <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{data.sub}</div>}
    </div>
  );
}

const nodeTypes = { opp: OppNode };
const ARCS: Record<"investor" | "funding" | "partner", [number, number]> = {
  investor: [-160, -20], // degrees, top
  funding: [150, 230], // left
  partner: [-50, 70], // right / bottom-right
};

export function Constellation({ startupName, matches, connections }: { startupName: string; matches: MatchView[]; connections: ConnectionView[] }) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node<NodeData>[] = [];
    const edges: Edge[] = [];
    const warm = connections.filter((c) => c.kind === "warm_path");
    const pathKeys = new Set(warm.flatMap((w) => ((w.payload.hops as { key: string }[]) ?? []).map((h) => h.key)));

    nodes.push({ id: "startup", type: "opp", position: { x: 0, y: 0 }, data: { label: startupName, kind: "startup" }, draggable: false });

    for (const type of ["investor", "funding", "partner"] as const) {
      const list = matches.filter((m) => m.targetType === type).slice(0, 6);
      const [a0, a1] = ARCS[type];
      list.forEach((m, i) => {
        const t = list.length === 1 ? 0.5 : i / (list.length - 1);
        const ang = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
        const r = 230 + (1 - m.fit) * 260;
        const id = `${type}:${m.targetId}`;
        nodes.push({
          id, type: "opp", position: { x: Math.cos(ang) * r * 1.35, y: Math.sin(ang) * r },
          data: { label: (m.target as { name: string }).name.replace(/\s*\(.*\)$/, ""), kind: type, fit: m.fit, onPath: pathKeys.has(id), top: i === 0 },
        });
        edges.push({
          id: `e-${id}`, source: "startup", target: id,
          style: { stroke: type === "investor" ? "#4acceb" : type === "funding" ? "#3db774" : "#7eb7c1", strokeOpacity: 0.25 + m.fit * 0.5, strokeWidth: 1 + m.fit * 2.5 },
        });
      });
    }

    // Warm intro paths: add bridge nodes and gold animated edges along the hops.
    warm.forEach((w, wi) => {
      const hops = (w.payload.hops as { key: string; name: string }[]) ?? [];
      hops.forEach((h, i) => {
        if (i === 0) return;
        const nodeId = h.key;
        if (!nodes.find((n) => n.id === nodeId)) {
          const target = nodes.find((n) => n.id === hops[hops.length - 1].key);
          const base = target?.position ?? { x: 0, y: -400 };
          const f = i / hops.length;
          nodes.push({
            id: nodeId, type: "opp",
            position: { x: base.x * f + (wi % 2 ? 140 : -140), y: base.y * f + 30 * i },
            data: { label: h.name.replace(/\s*\(.*\)$/, ""), kind: "bridge", sub: "intro bridge", onPath: true },
          });
        }
        const prev = i === 1 ? "startup" : hops[i - 1].key;
        edges.push({
          id: `w-${wi}-${i}`, source: prev, target: nodeId, animated: true,
          style: { stroke: "#dfae32", strokeWidth: 2.2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#dfae32" },
        });
      });
    });
    return { nodes, edges };
  }, [startupName, matches, connections]);

  return (
    <div className="glass relative h-[560px] overflow-hidden rounded-3xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        minZoom={0.3}
        colorMode="dark"
        style={{ background: "transparent" }}
      >
        <Background color="#cfdee8" gap={28} size={1} style={{ opacity: 0.06 }} />
      </ReactFlow>
      <div className="pointer-events-none absolute bottom-3 left-4 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-tech" /> Investors</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-impact" /> Grants & funding</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-business" /> Partners & clients</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-gold" /> Warm intro path</span>
        <span>Closer = better fit · thicker = stronger</span>
      </div>
    </div>
  );
}
