"use client";

import { motion } from "motion/react";
import { Building2, CalendarClock, Check, Coins, ExternalLink, FlaskConical, Landmark, Minus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MatchView } from "@/lib/queries";
import type { Funding, Investor, Partner } from "@/lib/types";
import { cn } from "@/lib/utils";

const eur = (n: number | null | undefined) =>
  n == null ? null : n >= 1_000_000 ? `€${+(n / 1_000_000).toFixed(1)}M` : `€${Math.round(n / 1000)}k`;

const STATUS = {
  ready: { label: "Ready now", cls: "bg-impact/15 text-impact" },
  stretch: { label: "Stretch", cls: "bg-tech/15 text-tech" },
  after_milestone: { label: "After milestone", cls: "bg-warn/15 text-warn" },
} as const;

function meta(m: MatchView): { icon: React.ReactNode; line: string; link?: string | null } {
  if (m.targetType === "investor") {
    const t = m.target as Investor;
    return {
      icon: <Landmark className="size-4" />,
      line: [t.type.toUpperCase().replace("_", " "), t.hq, t.ticket_min_eur != null && `${eur(t.ticket_min_eur)}–${eur(t.ticket_max_eur)}`, t.fund_size_eur_m && `fund €${t.fund_size_eur_m}M`].filter(Boolean).join(" · "),
      link: t.website,
    };
  }
  if (m.targetType === "funding") {
    const t = m.target as Funding;
    return {
      icon: <Coins className="size-4" />,
      line: [t.provider, t.kind.replace("_", " "), t.amount_max_eur && `up to ${eur(t.amount_max_eur)}`, t.deadline_date ? `deadline ${t.deadline_date}` : t.rolling ? "rolling" : null].filter(Boolean).join(" · "),
      link: t.url,
    };
  }
  const t = m.target as Partner;
  return {
    icon: t.kind === "research" ? <FlaskConical className="size-4" /> : <Building2 className="size-4" />,
    line: [t.kind, t.hq, t.role.slice(0, 2).join(", ").replaceAll("_", " ")].filter(Boolean).join(" · "),
  };
}

function MatchCard({ m, i }: { m: MatchView; i: number }) {
  const info = meta(m);
  const name = (m.target as { name: string }).name;
  const est = (m.target as { confidence?: string | null }).confidence === "est";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className={cn("glass glass-hover rounded-2xl p-4", i === 0 && "border-gold/40 shadow-[0_0_30px_-12px_#dfae32]")}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", i === 0 ? "bg-gold text-navy-900" : "bg-accent text-ice")}>
          {info.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground tabular">#{m.rank}</span>
            <span className="font-semibold">{name}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS[m.status].cls)}>{STATUS[m.status].label}</span>
            {(m.target as { is_challenge_partner?: boolean }).is_challenge_partner && (
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">Challenge partner</span>
            )}
            {info.link && (
              <a href={info.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-gold" aria-label={`Open ${name}`}>
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {info.line}
            {est && <span className="ml-1 text-warn/80">· ≈ verify before outreach</span>}
          </div>
        </div>
        <div className="w-24 shrink-0 text-right">
          <div className="text-lg font-bold leading-none tabular">{Math.round(m.fit * 100)}<span className="text-xs text-muted-foreground">% fit</span></div>
          <div className="mt-1.5 h-1 rounded-full bg-muted">
            <div className={cn("h-1 rounded-full", i === 0 ? "bg-gold" : "bg-tech")} style={{ width: `${Math.min(100, m.fit * 100)}%` }} />
          </div>
          {m.calibratedFit != null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  Jev <span className="tabular text-tech">{Math.round(m.calibratedFit * 100)}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Calibrated probability this investor would invest in the next 12 months</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      {m.rationale && <p className="mt-3 text-sm leading-relaxed text-ice/85">{m.rationale}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {m.reasons.slice(0, 5).map((r) => (
          <span key={r} className="flex items-center gap-1 rounded-md bg-impact/10 px-2 py-1 text-[11px] text-ice/90">
            <Check className="size-3 text-impact" /> {r}
          </span>
        ))}
        {m.blockers.map((b) => (
          <span key={b} className="flex items-center gap-1 rounded-md bg-warn/10 px-2 py-1 text-[11px] text-warn">
            <Minus className="size-3" /> {b}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function Opportunities({ matches }: { matches: MatchView[] }) {
  const groups = {
    investor: matches.filter((m) => m.targetType === "investor"),
    funding: matches.filter((m) => m.targetType === "funding"),
    partner: matches.filter((m) => m.targetType === "partner"),
  };
  const soon = groups.funding.filter((m) => {
    const d = (m.target as Funding).deadline_date;
    return d && new Date(d).getTime() - Date.now() < 45 * 86_400_000;
  }).length;
  return (
    <Tabs defaultValue="investor" className="w-full">
      <TabsList className="mb-3 bg-navy-950/40">
        <TabsTrigger value="investor">Investors <span className="ml-1.5 text-muted-foreground tabular">{groups.investor.length}</span></TabsTrigger>
        <TabsTrigger value="funding">
          Grants & funding <span className="ml-1.5 text-muted-foreground tabular">{groups.funding.length}</span>
          {soon > 0 && <CalendarClock className="ml-1 size-3.5 text-gold" />}
        </TabsTrigger>
        <TabsTrigger value="partner">Partners & clients <span className="ml-1.5 text-muted-foreground tabular">{groups.partner.length}</span></TabsTrigger>
      </TabsList>
      {(Object.keys(groups) as (keyof typeof groups)[]).map((k) => (
        <TabsContent key={k} value={k} className="space-y-3">
          {groups[k].slice(0, 8).map((m, i) => <MatchCard key={m.targetId} m={m} i={i} />)}
          {groups[k].length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
        </TabsContent>
      ))}
    </Tabs>
  );
}
