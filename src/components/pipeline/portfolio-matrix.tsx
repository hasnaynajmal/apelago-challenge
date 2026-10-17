"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { FIT_AT, READY_AT } from "@/lib/quadrant";
import type { PipelineRow } from "@/lib/queries";
import { QUADRANTS } from "./quadrants";

const W = 760;
const H = 480;
const PAD = { l: 56, r: 20, t: 20, b: 48 };
const round = (n: number) => Math.round(n * 10) / 10;
const Y_TOP = 1.13; // headroom above 100% fit for the quadrant labels
// Small deterministic offset so ventures with identical scores do not sit exactly on top of each other.
function jitter(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return { dx: ((h % 13) - 6) * 1.6, dy: (((h >> 4) % 13) - 6) * 1.6 };
}

export function PortfolioMatrix({ rows, lens }: { rows: PipelineRow[]; lens: string }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const pts = rows.filter((r) => r.readiness != null && r.thesisFit != null);
  const xMax = Math.max(7, Math.ceil(Math.max(...pts.map((p) => p.readiness!)) + 0.5));
  const yMin = Math.min(0.5, Math.floor(Math.min(...pts.map((p) => p.thesisFit!)) * 10) / 10 - 0.12);
  const x = (v: number) => round(PAD.l + ((v - 1) / (xMax - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => round(PAD.t + ((Y_TOP - v) / (Y_TOP - yMin)) * (H - PAD.t - PAD.b));
  const labelled = new Set([...pts].sort((a, b) => (b.promise ?? 0) - (a.promise ?? 0)).slice(0, 3).map((p) => p.id));
  const cx = x(READY_AT);
  const cy = y(FIT_AT);

  const quads = [
    { q: "accelerate" as const, x0: PAD.l, y0: PAD.t, x1: cx, y1: cy, ax: "start", lx: PAD.l + 12, ly: PAD.t + 22 },
    { q: "invest" as const, x0: cx, y0: PAD.t, x1: W - PAD.r, y1: cy, ax: "end", lx: W - PAD.r - 12, ly: PAD.t + 22 },
    { q: "monitor" as const, x0: PAD.l, y0: cy, x1: cx, y1: H - PAD.b, ax: "start", lx: PAD.l + 12, ly: H - PAD.b - 14 },
    { q: "refer" as const, x0: cx, y0: cy, x1: W - PAD.r, y1: H - PAD.b, ax: "end", lx: W - PAD.r - 12, ly: H - PAD.b - 14 },
  ];

  return (
    <div className="card-surface p-6">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Readiness versus thesis fit">
        {quads.map((q) => (
          <g key={q.q}>
            <rect x={q.x0} y={q.y0} width={q.x1 - q.x0} height={q.y1 - q.y0} fill={QUADRANTS[q.q].fill} />
            <text x={q.lx} y={q.ly} textAnchor={q.ax as "start" | "end"} fontSize={14} fontWeight={600} fill={QUADRANTS[q.q].dot}>
              {QUADRANTS[q.q].label} · {pts.filter((p) => p.quadrant === q.q).length}
            </text>
          </g>
        ))}
        <line x1={cx} x2={cx} y1={PAD.t} y2={H - PAD.b} stroke="#d4d4d8" strokeDasharray="4 4" />
        <line x1={PAD.l} x2={W - PAD.r} y1={cy} y2={cy} stroke="#d4d4d8" strokeDasharray="4 4" />
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="#a1a1aa" />
        <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} stroke="#a1a1aa" />

        {Array.from({ length: xMax }, (_, i) => i + 1).map((v) => (
          <text key={v} x={x(v)} y={H - PAD.b + 20} textAnchor="middle" fontSize={13} fill="#71717a">{v}</text>
        ))}
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 6} textAnchor="middle" fontSize={13} fill="#52525b">
          Readiness → (average of technology, business and investment readiness, 1–9)
        </text>
        {[0.5, 0.75, 1].filter((v) => v >= yMin).map((v) => (
          <text key={v} x={PAD.l - 10} y={y(v) + 4} textAnchor="end" fontSize={13} fill="#71717a">{Math.round(v * 100)}%</text>
        ))}
        <text transform={`translate(16 ${(PAD.t + H - PAD.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={13} fill="#52525b">
          Thesis fit →
        </text>

        {pts.map((p, i) => {
          const j = jitter(p.id);
          const px = round(x(p.readiness!) + j.dx);
          const py = round(y(p.thesisFit!) + j.dy);
          const left = px > W * 0.72;
          const color = QUADRANTS[p.quadrant!].dot;
          const show = labelled.has(p.id) || hover === p.id;
          return (
            <motion.g
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: px, y: py }}
              transition={{ delay: i * 0.015, type: "spring", stiffness: 160, damping: 22 }}
              className="cursor-pointer"
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => router.push(`/startups/${p.id}?lens=${lens}`)}
            >
              <circle r={hover === p.id ? 9 : 7} fill={color} stroke="#fff" strokeWidth={2} />
              {show && (
                <text x={left ? -11 : 11} y={4.5} textAnchor={left ? "end" : "start"} fontSize={13} fontWeight={hover === p.id ? 600 : 500} fill="#18181b" paintOrder="stroke" stroke="#fff" strokeWidth={4}>
                  {p.name}
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
