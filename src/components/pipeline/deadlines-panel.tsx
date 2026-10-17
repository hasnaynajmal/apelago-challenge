import Link from "next/link";
import { Flag } from "@/components/country";
import type { DeadlineRow, InvestorDemand } from "@/lib/queries";
import { cn } from "@/lib/utils";

const eur = (n: number | null) => (n == null ? null : n >= 1_000_000 ? `€${+(n / 1_000_000).toFixed(1)}M` : `€${Math.round(n / 1000)}k`);

function VentureLinks({ items, lens, max = 3 }: { items: { id: string; name: string }[]; lens: string; max?: number }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.slice(0, max).map((e) => (
        <Link key={e.id} href={`/dashboard/startups/${e.id}?lens=${lens}`} className="rounded-md bg-muted px-2 py-0.5 text-sm text-zinc-700 transition-colors hover:bg-navy-soft hover:text-navy">
          {e.name}
        </Link>
      ))}
      {items.length > max && <span className="px-1 py-0.5 text-sm text-muted-foreground">+{items.length - max} more</span>}
    </div>
  );
}

export function DeadlinesPanel({ deadlines, lens, title = "Upcoming deadlines", sub = "Funding calls in the next 4 months", max = 3 }: { deadlines: DeadlineRow[]; lens: string; title?: string; sub?: string; max?: number }) {
  return (
    <div className="card-surface">
      <div className="border-b px-5 py-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
      <ul className="divide-y">
        {deadlines.map((d) => {
          const date = new Date(d.date);
          const urgent = d.days <= 30;
          return (
            <li key={d.id} className="flex items-start gap-4 px-5 py-4">
              <div className={cn("flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border", urgent && "border-amber-300 bg-amber-50")}>
                <span className="text-base font-semibold leading-none tabular">{date.getUTCDate()}</span>
                <span className="mt-0.5 text-[11px] font-medium uppercase text-muted-foreground">{date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold leading-snug">{d.name}</div>
                <div className={cn("mt-0.5 text-sm", urgent ? "text-amber-700" : "text-muted-foreground")}>
                  {d.days} days left{d.amount ? ` · up to ${eur(d.amount)}` : ""} · {d.eligible.length} ventures fit
                </div>
                {d.eligible.length > 0 && <VentureLinks items={d.eligible} lens={lens} max={max} />}
              </div>
            </li>
          );
        })}
        {deadlines.length === 0 && <li className="px-5 py-8 text-muted-foreground">No upcoming deadlines.</li>}
      </ul>
    </div>
  );
}

export function InvestorDemandPanel({ investors, lens, title = "Investors to activate", sub = "Most frequent top-3 match across the portfolio", max = 3 }: { investors: InvestorDemand[]; lens: string; title?: string; sub?: string; max?: number }) {
  return (
    <div className="card-surface">
      <div className="border-b px-5 py-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
      <ul className="divide-y">
        {investors.map((i) => (
          <li key={i.id} className="px-5 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Flag code={i.hq} />
                <span className="truncate text-sm font-semibold">{i.name}</span>
                {i.isPartner && <span className="shrink-0 rounded-full bg-gold-soft px-2 py-0.5 text-xs font-medium text-gold-ink">Partner</span>}
              </div>
              <span className="shrink-0 text-sm text-muted-foreground tabular">{i.ventures.length} ventures</span>
            </div>
            <VentureLinks items={i.ventures} lens={lens} max={max} />
          </li>
        ))}
      </ul>
    </div>
  );
}
