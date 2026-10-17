"use client";

// Agentic UI: how the copilot's tool results look inside the chat. Each card takes the tool's JSON result.
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarClock, Landmark, Loader2, Route, Sparkles } from "lucide-react";
import { Flag } from "@/components/country";
import { cn } from "@/lib/utils";

const LEVELS = [
  { k: "trl", label: "Tech", color: "#0891b2" },
  { k: "brl", label: "Business", color: "#2563eb" },
  { k: "oirl", label: "Impact", color: "#059669" },
  { k: "irl", label: "Invest", color: "#a87c12" },
] as const;

const GROUP_STYLE: Record<string, string> = {
  "Investment-ready": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Accelerate: "bg-navy-soft text-navy ring-blue-200",
  "Refer onwards": "bg-amber-50 text-amber-700 ring-amber-200",
  Monitor: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

type Levels = Partial<Record<"trl" | "brl" | "oirl" | "irl", number | null>>;

export interface VentureRow {
  id: string;
  name: string;
  country: string | null;
  sector: string | null;
  score: number | null;
  thesisFit: number | null;
  group: string | null;
  levels: Levels;
  topInvestor?: string | null;
  nextStep?: string | null;
}

const href = (id: string, lens?: string) => `/dashboard/startups/${id}${lens ? `?lens=${lens}` : ""}`;

function Shell({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="my-2 overflow-hidden rounded-xl border bg-white">
      <div className="flex items-center gap-2 border-b bg-zinc-50/80 px-3 py-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5 text-navy" />
        {title}
      </div>
      {children}
    </div>
  );
}

export function GroupBadge({ group }: { group: string | null }) {
  if (!group) return null;
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", GROUP_STYLE[group])}>{group}</span>;
}

function MiniLevels({ levels }: { levels: Levels }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {LEVELS.map((l) => {
        const v = levels[l.k] ?? 0;
        return (
          <div key={l.k}>
            <div className="flex items-baseline justify-between text-[10px] text-muted-foreground">
              {l.label}
              <span className="font-semibold tabular" style={{ color: l.color }}>{v || "–"}</span>
            </div>
            <div className="mt-0.5 h-1 rounded-full bg-muted">
              <div className="h-1 rounded-full" style={{ width: `${(v / 9) * 100}%`, background: l.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Running state shown while a tool executes. */
export function ToolPending({ label }: { label: string }) {
  return (
    <div className="my-2 flex items-center gap-2 rounded-xl border border-dashed bg-white px-3 py-2.5 text-xs text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin text-navy" />
      {label}
    </div>
  );
}

export function VentureListCard({ title, ventures, lens, total }: { title: string; ventures: VentureRow[]; lens?: string; total?: number }) {
  if (!ventures.length) return <Shell icon={Sparkles} title={title}><div className="px-3 py-3 text-sm text-muted-foreground">No ventures match.</div></Shell>;
  return (
    <Shell icon={Sparkles} title={total != null && total > ventures.length ? `${title} · top ${ventures.length} of ${total}` : title}>
      <ul className="divide-y">
        {ventures.map((v) => (
          <li key={v.id}>
            <Link href={href(v.id, lens)} className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-zinc-50">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Flag code={v.country} className="h-3" />
                  <span className="truncate text-sm font-medium group-hover:text-navy">{v.name}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  {v.sector && <span className="truncate">{v.sector}</span>}
                  <GroupBadge group={v.group} />
                </div>
              </div>
              {v.score != null && (
                <div className="w-14 shrink-0 text-right">
                  <span className="text-lg font-semibold leading-none tabular">{v.score}</span>
                  <span className="text-[10px] text-muted-foreground">/100</span>
                  <div className="mt-1 h-1 rounded-full bg-muted">
                    <div className="h-1 rounded-full bg-navy" style={{ width: `${v.score}%` }} />
                  </div>
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export interface VentureSnapshot {
  id: string;
  name: string;
  country: string | null;
  sectors: string[];
  score: number | null;
  thesisFit: number | null;
  headline: string | null;
  levels: Partial<Record<"trl" | "brl" | "oirl" | "irl", { level: number } | null>>;
  investorsLabel: string;
  investors: { name: string; fit: number }[];
  funding: { name: string; fit: number }[];
  actions: { when: string; title: string }[];
  lens: string;
  error?: string;
}

export function VentureSnapshotCard({ v }: { v: VentureSnapshot }) {
  if (v.error) return <div className="my-2 rounded-xl border bg-white px-3 py-2.5 text-sm text-muted-foreground">{v.error}</div>;
  const levels = Object.fromEntries(Object.entries(v.levels).map(([k, x]) => [k, x?.level ?? null])) as Levels;
  return (
    <Shell icon={Sparkles} title="Venture snapshot">
      <div className="space-y-3 px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Flag code={v.country} className="h-3" />
              <span className="truncate font-semibold">{v.name}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">{v.sectors.slice(0, 2).join(" · ")}</div>
          </div>
          {v.score != null && (
            <div className="text-right">
              <span className="text-2xl font-semibold leading-none tabular">{v.score}</span>
              <span className="text-[10px] text-muted-foreground">/100</span>
              {v.thesisFit != null && <div className="text-[10px] text-muted-foreground">{v.thesisFit}% thesis fit</div>}
            </div>
          )}
        </div>
        <MiniLevels levels={levels} />
        {(v.investors[0] || v.funding[0]) && (
          <div className="space-y-1.5 text-xs">
            {v.investors[0] && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/70 px-2.5 py-1.5">
                <span className="text-muted-foreground">{v.investorsLabel}</span>
                <span className="truncate font-medium">{v.investors[0].name}</span>
              </div>
            )}
            {v.funding[0] && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/70 px-2.5 py-1.5">
                <span className="text-muted-foreground">Funding</span>
                <span className="truncate font-medium">{v.funding[0].name}</span>
              </div>
            )}
          </div>
        )}
        <Link href={href(v.id, v.lens)} className="inline-flex items-center gap-1 text-xs font-medium text-navy hover:underline">
          Open venture page <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </Shell>
  );
}

export function CompareCard({ ventures, lens }: { ventures: VentureRow[]; lens?: string }) {
  const rows: { label: string; get: (v: VentureRow) => React.ReactNode; best?: (v: VentureRow) => number }[] = [
    { label: "Score", get: (v) => v.score ?? "–", best: (v) => v.score ?? -1 },
    { label: "Thesis fit", get: (v) => (v.thesisFit != null ? `${v.thesisFit}%` : "–"), best: (v) => v.thesisFit ?? -1 },
    ...LEVELS.map((l) => ({ label: l.label, get: (v: VentureRow) => v.levels[l.k] ?? "–", best: (v: VentureRow) => v.levels[l.k] ?? -1 })),
    { label: "Group", get: (v) => <GroupBadge group={v.group} /> },
    { label: "Top investor", get: (v) => <span className="line-clamp-2">{v.topInvestor ?? "–"}</span> },
  ];
  return (
    <Shell icon={Sparkles} title="Side by side">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="w-20" />
              {ventures.map((v) => (
                <th key={v.id} className="px-2 py-2 text-left font-semibold">
                  <Link href={href(v.id, lens)} className="hover:text-navy hover:underline">{v.name}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const top = r.best ? Math.max(...ventures.map(r.best)) : null;
              return (
                <tr key={r.label} className="border-b last:border-0">
                  <td className="px-3 py-1.5 text-muted-foreground">{r.label}</td>
                  {ventures.map((v) => (
                    <td key={v.id} className={cn("px-2 py-1.5 tabular", r.best && top != null && top >= 0 && r.best(v) === top && "font-semibold text-navy")}>
                      {r.get(v)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

export interface DeadlineItem {
  name: string;
  provider: string | null;
  date: string;
  daysLeft: number;
  amountEur: number | null;
  ventures: { id: string; name: string }[];
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const fmtEur = (n: number) => (n >= 1e6 ? `€${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}M` : `€${Math.round(n / 1e3)}k`);

export function DeadlinesCard({ deadlines, lens }: { deadlines: DeadlineItem[]; lens?: string }) {
  return (
    <Shell icon={CalendarClock} title="Funding deadlines">
      {!deadlines.length && <div className="px-3 py-3 text-sm text-muted-foreground">No deadlines in this window.</div>}
      <ul className="divide-y">
        {deadlines.map((d) => (
          <li key={d.name + d.date} className="flex gap-3 px-3 py-2.5">
            <div className={cn("w-11 shrink-0 rounded-lg py-1 text-center", d.daysLeft <= 30 ? "bg-amber-50 text-amber-700" : "bg-muted text-zinc-700")}>
              <div className="text-sm font-semibold leading-none tabular">{d.daysLeft}</div>
              <div className="text-[9px] uppercase">days</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{d.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {fmtDate(d.date)}
                {d.amountEur ? ` · up to ${fmtEur(d.amountEur)}` : ""}
              </div>
              {d.ventures.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {d.ventures.map((v) => (
                    <Link key={v.id} href={href(v.id, lens)} className="rounded-full border px-1.5 py-px text-[10px] hover:border-navy hover:text-navy">
                      {v.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export interface InvestorItem {
  name: string;
  type: string;
  hq: string | null;
  ticket: [number | null, number | null] | null;
  website: string | null;
  matchedVentures: string[];
}

export function InvestorsCard({ investors }: { investors: InvestorItem[] }) {
  if (!investors.length) return null; // the agent explains why in text
  return (
    <Shell icon={Landmark} title="Investors">
      <ul className="divide-y">
        {investors.map((i) => (
          <li key={i.name} className="px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <Flag code={i.hq} className="h-3" />
                {i.website ? (
                  <a href={i.website} target="_blank" rel="noreferrer" className="truncate text-sm font-medium hover:text-navy hover:underline">{i.name}</a>
                ) : (
                  <span className="truncate text-sm font-medium">{i.name}</span>
                )}
              </div>
              {i.matchedVentures.length > 0 && (
                <span className="shrink-0 rounded-full bg-navy-soft px-2 py-0.5 text-[10px] font-medium text-navy">
                  {i.matchedVentures.length} matches
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {i.type.replace(/_/g, " ").toUpperCase()}
              {i.ticket && (i.ticket[0] || i.ticket[1]) ? ` · ticket ${[i.ticket[0], i.ticket[1]].filter(Boolean).map((n) => fmtEur(n!)).join("–")}` : ""}
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export interface OverviewResult {
  ventures: number;
  groups: Record<string, number>;
  averageLevels: Levels;
  top: VentureRow[];
  lens: string;
}

export function OverviewCard({ o }: { o: OverviewResult }) {
  const max = Math.max(1, ...Object.values(o.groups));
  return (
    <Shell icon={Sparkles} title={`Portfolio · ${o.ventures} ventures`}>
      <div className="space-y-3 px-3 py-3">
        <div className="space-y-1.5">
          {Object.entries(o.groups).map(([g, n]) => (
            <div key={g} className="flex items-center gap-2 text-xs">
              <span className="w-28 shrink-0 text-muted-foreground">{g}</span>
              <div className="h-1.5 flex-1 rounded-full bg-muted">
                <div className="h-1.5 rounded-full bg-navy" style={{ width: `${(n / max) * 100}%` }} />
              </div>
              <span className="w-5 text-right font-medium tabular">{n}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-1 text-[11px] text-muted-foreground">Average readiness</div>
          <MiniLevels levels={o.averageLevels} />
        </div>
      </div>
      <VentureListInline ventures={o.top} lens={o.lens} />
    </Shell>
  );
}

function VentureListInline({ ventures, lens }: { ventures: VentureRow[]; lens?: string }) {
  return (
    <ul className="divide-y border-t">
      {ventures.map((v, i) => (
        <li key={v.id}>
          <Link href={href(v.id, lens)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50">
            <span className={cn("flex size-4 items-center justify-center rounded-full text-[10px] font-semibold", i === 0 ? "bg-gold text-navy" : "bg-muted text-zinc-600")}>{i + 1}</span>
            <span className="flex-1 truncate font-medium">{v.name}</span>
            <span className="font-semibold tabular">{v.score}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export interface ConnectionItem {
  kind: string;
  title: string;
  path: string[] | null;
  detail: string | null;
  ventureId: string;
  ventureName: string;
}

const KIND_LABEL: Record<string, string> = {
  warm_path: "Warm intro path",
  consortium: "Consortium",
  synergy: "Synergy",
  unlock: "Unlock",
  deadline: "Deadline",
};

export function ConnectionsCard({ connections, total, lens }: { connections: ConnectionItem[]; total: number; lens?: string }) {
  if (!connections.length) return null;
  return (
    <Shell icon={Route} title={total > connections.length ? `Connections · top ${connections.length} of ${total}` : "Connections"}>
      <ul className="divide-y">
        {connections.map((c, i) => (
          <li key={i} className="space-y-1.5 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span className="font-medium text-gold-ink">{KIND_LABEL[c.kind] ?? c.kind}</span>
              <Link href={href(c.ventureId, lens)} className="truncate hover:text-navy hover:underline">{c.ventureName}</Link>
            </div>
            {c.path ? (
              <div className="flex flex-wrap items-center gap-1">
                {c.path.map((h, j) => (
                  <span key={j} className="flex items-center gap-1">
                    {j > 0 && <ArrowRight className="size-3 text-muted-foreground" />}
                    <span
                      className={cn(
                        "rounded-md border px-1.5 py-0.5 text-xs",
                        j === c.path!.length - 1 ? "border-navy/20 bg-navy-soft font-medium text-navy" : "bg-white",
                      )}
                    >
                      {h}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm font-medium">{c.title}</div>
            )}
            {c.detail && !c.path && <p className="line-clamp-2 text-xs text-muted-foreground">{c.detail}</p>}
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export interface PlatformGuide {
  purpose: string;
  data: Record<string, number>;
  pipeline: { step: string; what: string }[];
  scales: Record<string, string>;
  score: { weights: Record<string, string> | null };
  currentThesis: string;
}

export function PlatformCard({ g }: { g: PlatformGuide }) {
  const LABEL: Record<string, string> = { irl: "Investment readiness", thesis_fit: "Thesis fit", impact: "Ocean impact", momentum: "Momentum", team: "Team" };
  return (
    <Shell icon={Sparkles} title="How Radar works">
      <div className="space-y-3 px-3 py-3">
        <div className="grid grid-cols-5 gap-1 text-center">
          {Object.entries(g.data).map(([k, v]) => (
            <div key={k} className="rounded-lg bg-muted/70 py-1.5">
              <div className="text-sm font-semibold tabular">{v}</div>
              <div className="text-[9px] text-muted-foreground capitalize">{k}</div>
            </div>
          ))}
        </div>
        <ol className="space-y-2">
          {g.pipeline.map((p, i) => (
            <li key={p.step} className="flex gap-2.5">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-navy-soft text-[10px] font-semibold text-navy">{i + 1}</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold">{p.step}</div>
                <div className="text-[11px] leading-snug text-muted-foreground">{p.what}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="grid grid-cols-4 gap-1.5">
          {LEVELS.map((l) => (
            <div key={l.k} className="rounded-lg border px-2 py-1.5">
              <div className="text-[11px] font-semibold" style={{ color: l.color }}>{l.k.toUpperCase()}</div>
              <div className="text-[10px] text-muted-foreground">{l.label}</div>
            </div>
          ))}
        </div>
        {g.score.weights && (
          <div>
            <div className="mb-1 text-[11px] text-muted-foreground">Score for {g.currentThesis}</div>
            <div className="flex h-2 overflow-hidden rounded-full">
              {Object.entries(g.score.weights).map(([k, v], i) => (
                <div key={k} title={`${LABEL[k] ?? k} ${v}`} style={{ width: v, background: ["#002444", "#2563eb", "#059669", "#0891b2", "#a87c12"][i % 5] }} />
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
              {Object.entries(g.score.weights).map(([k, v], i) => (
                <span key={k} className="inline-flex items-center gap-1">
                  <span className="size-1.5 rounded-full" style={{ background: ["#002444", "#2563eb", "#059669", "#0891b2", "#a87c12"][i % 5] }} />
                  {LABEL[k] ?? k} {v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
