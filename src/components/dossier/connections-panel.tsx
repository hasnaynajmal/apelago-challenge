import { CalendarClock, Combine, KeyRound, Route, Sprout } from "lucide-react";
import type { ConnectionView } from "@/lib/queries";
import { cn } from "@/lib/utils";

const KIND = {
  warm_path: { label: "Warm intro path", icon: Route, cls: "text-gold", ring: "border-gold/40" },
  unlock: { label: "Unlock", icon: KeyRound, cls: "text-tech", ring: "border-tech/30" },
  consortium: { label: "Consortium", icon: Combine, cls: "text-business", ring: "border-business/30" },
  synergy: { label: "Portfolio synergy", icon: Sprout, cls: "text-impact", ring: "border-impact/30" },
  deadline: { label: "Deadline", icon: CalendarClock, cls: "text-warn", ring: "border-warn/30" },
} as const;

type Hop = { key: string; name: string };

export function ConnectionsPanel({ connections }: { connections: ConnectionView[] }) {
  const order = ["warm_path", "unlock", "deadline", "consortium", "synergy"] as const;
  const sorted = [...connections].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  if (!sorted.length) return <p className="text-sm text-muted-foreground">No hidden connections found yet.</p>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {sorted.map((c) => {
        const k = KIND[c.kind];
        const Icon = k.icon;
        const hops = c.kind === "warm_path" ? ((c.payload.hops as Hop[]) ?? []) : [];
        return (
          <div key={c.title} className={cn("glass rounded-2xl border p-4", k.ring)}>
            <div className={cn("flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]", k.cls)}>
              <Icon className="size-3.5" /> {k.label}
            </div>
            <div className="mt-1.5 font-semibold">{c.title}</div>
            {hops.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                {hops.map((h, i) => (
                  <span key={h.key} className="flex items-center gap-1.5">
                    <span className={cn("rounded-md px-2 py-1", i === 0 ? "bg-accent" : i === hops.length - 1 ? "bg-gold/20 text-gold" : "bg-muted")}>{h.name}</span>
                    {i < hops.length - 1 && <span className="text-gold">→</span>}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-xs leading-relaxed text-ice/75">{c.narrative}</p>
          </div>
        );
      })}
    </div>
  );
}
