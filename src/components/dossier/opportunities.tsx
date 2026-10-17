"use client";

import { motion } from "motion/react";
import { Building2, Check, Coins, ExternalLink, FlaskConical, Landmark, Minus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MatchView } from "@/lib/queries";
import type { Funding, Investor, Partner } from "@/lib/types";
import { cn } from "@/lib/utils";
import { countryName } from "@/components/country";

const eur = (n: number | null | undefined) =>
  n == null ? null : n >= 1_000_000 ? `€${+(n / 1_000_000).toFixed(1)}M` : `€${Math.round(n / 1000)}k`;

const STATUS = {
  ready: { label: "Ready now", cls: "bg-emerald-50 text-emerald-700" },
  stretch: { label: "Stretch", cls: "bg-sky-50 text-sky-700" },
  after_milestone: { label: "After a milestone", cls: "bg-amber-50 text-amber-700" },
} as const;

function meta(m: MatchView): { icon: React.ReactNode; line: string; link?: string | null } {
  if (m.targetType === "investor") {
    const t = m.target as Investor;
    return {
      icon: <Landmark className="size-4" />,
      line: [t.type === "vc" ? "VC" : t.type === "cvc" ? "Corporate VC" : t.type === "pe" ? "Growth equity" : t.type === "angel_network" ? "Angel network" : "Public investor", countryName(t.hq), t.ticket_min_eur != null && `${eur(t.ticket_min_eur)}–${eur(t.ticket_max_eur)} tickets`].filter(Boolean).join(" · "),
      link: t.website,
    };
  }
  if (m.targetType === "funding") {
    const t = m.target as Funding;
    return {
      icon: <Coins className="size-4" />,
      line: [t.provider, t.amount_max_eur && `up to ${eur(t.amount_max_eur)}`, t.deadline_date ? `deadline ${new Date(t.deadline_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : t.rolling ? "rolling" : null].filter(Boolean).join(" · "),
      link: t.url,
    };
  }
  const t = m.target as Partner;
  return {
    icon: t.kind === "research" ? <FlaskConical className="size-4" /> : <Building2 className="size-4" />,
    line: [t.kind === "research" ? "Research" : t.kind === "corporate" ? "Corporate" : t.kind === "public" ? "Public body" : "Ecosystem", countryName(t.hq), t.role.slice(0, 2).join(", ").replaceAll("_", " ")].filter(Boolean).join(" · "),
  };
}

function MatchCard({ m, i }: { m: MatchView; i: number }) {
  const info = meta(m);
  const name = (m.target as { name: string }).name;
  const est = (m.target as { confidence?: string | null }).confidence === "est";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className={cn("card-surface card-hover p-5", i === 0 && "ring-1 ring-gold/60")}
    >
      <div className="flex items-start gap-4">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", i === 0 ? "bg-gold-soft text-gold-ink" : "bg-muted text-zinc-600")}>
          {info.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold">{name}</span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS[m.status].cls)}>{STATUS[m.status].label}</span>
            {(m.target as { is_challenge_partner?: boolean }).is_challenge_partner && (
              <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-medium text-gold-ink">Challenge partner</span>
            )}
            {info.link && (
              <a href={info.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-navy" aria-label={`Open ${name}`}>
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {info.line}
            {est && <span className="text-amber-700"> · figures approximate</span>}
          </div>
        </div>
        <div className="w-24 shrink-0 text-right">
          <div className="text-2xl font-semibold tracking-tight tabular">{Math.round(m.fit * 100)}<span className="text-sm font-normal text-muted-foreground">%</span></div>
          <div className="text-xs text-muted-foreground">fit</div>
          {m.calibratedFit != null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-1 text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
                  {Math.round(m.calibratedFit * 100)}% likely
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-sm">Calibrated probability (Jev) that this investor would invest in the next 12 months</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      {m.rationale && <p className="mt-4 text-[15px] leading-relaxed text-zinc-700">{m.rationale}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {m.reasons.slice(0, 5).map((r) => (
          <span key={r} className="flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1 text-sm text-zinc-700">
            <Check className="size-3.5 text-emerald-600" /> {r}
          </span>
        ))}
        {m.blockers.map((b) => (
          <span key={b} className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-sm text-amber-800">
            <Minus className="size-3.5" /> {b}
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
  const labels = { investor: "Investors", funding: "Grants & funding", partner: "Partners & clients" };
  return (
    <Tabs defaultValue="investor" className="w-full">
      <TabsList className="mb-4 h-11 rounded-full p-1">
        {(Object.keys(groups) as (keyof typeof groups)[]).map((k) => (
          <TabsTrigger key={k} value={k} className="rounded-full px-4 text-[15px]">
            {labels[k]} <span className="ml-1.5 text-muted-foreground tabular">{groups[k].length}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {(Object.keys(groups) as (keyof typeof groups)[]).map((k) => (
        <TabsContent key={k} value={k} className="space-y-3">
          {groups[k].slice(0, 8).map((m, i) => <MatchCard key={m.targetId} m={m} i={i} />)}
          {groups[k].length === 0 && <p className="text-muted-foreground">No matches.</p>}
        </TabsContent>
      ))}
    </Tabs>
  );
}
