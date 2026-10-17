import { ArrowRight, CalendarClock, Combine, KeyRound, Route, Sprout } from "lucide-react";
import type { ConnectionView } from "@/lib/queries";
import { cn } from "@/lib/utils";

const KIND = {
  warm_path: { label: "Warm intro path", icon: Route, cls: "bg-gold-soft text-gold-ink" },
  unlock: { label: "Unlock", icon: KeyRound, cls: "bg-sky-50 text-sky-700" },
  deadline: { label: "Deadline", icon: CalendarClock, cls: "bg-amber-50 text-amber-700" },
  consortium: { label: "Consortium", icon: Combine, cls: "bg-blue-50 text-blue-700" },
  synergy: { label: "Portfolio synergy", icon: Sprout, cls: "bg-emerald-50 text-emerald-700" },
} as const;

type Hop = { key: string; name: string };

export function ConnectionsPanel({ connections }: { connections: ConnectionView[] }) {
  const order = ["warm_path", "unlock", "deadline", "consortium", "synergy"] as const;
  const sorted = [...connections].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  if (!sorted.length) return <p className="text-muted-foreground">No hidden connections found yet.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sorted.map((c) => {
        const k = KIND[c.kind];
        const Icon = k.icon;
        const hops = c.kind === "warm_path" ? ((c.payload.hops as Hop[]) ?? []) : [];
        return (
          <div key={c.title} className="card-surface card-hover p-5">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", k.cls)}>
              <Icon className="size-3.5" /> {k.label}
            </span>
            <div className="mt-3 text-base font-semibold">{c.title}</div>
            {hops.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {hops.map((h, i) => (
                  <span key={h.key} className="flex items-center gap-2">
                    <span className={cn("rounded-lg border px-2.5 py-1", i === hops.length - 1 ? "border-gold/50 bg-gold-soft font-medium text-gold-ink" : "bg-white")}>
                      {h.name}
                    </span>
                    {i < hops.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground" />}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">{c.narrative}</p>
          </div>
        );
      })}
    </div>
  );
}
