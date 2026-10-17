import { Briefcase, Rocket } from "lucide-react";
import type { ActionView } from "@/lib/queries";
import { cn } from "@/lib/utils";

const COLS = [
  { id: "now", label: "Now", sub: "this week" },
  { id: "30d", label: "Next 30 days", sub: "" },
  { id: "90d", label: "Next 90 days", sub: "" },
] as const;

export function ActionPlan({ actions }: { actions: ActionView[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {COLS.map((col, ci) => {
        const items = actions.filter((a) => a.horizon === col.id);
        return (
          <div key={col.id} className="relative">
            <div className="mb-3 flex items-center gap-2">
              <span className={cn("flex size-6 items-center justify-center rounded-full text-[11px] font-bold", ci === 0 ? "bg-gold text-navy-900" : "bg-accent text-ice")}>
                {ci + 1}
              </span>
              <span className="text-sm font-semibold">{col.label}</span>
              {col.sub && <span className="text-xs text-muted-foreground">· {col.sub}</span>}
            </div>
            <div className="space-y-3 border-l border-border/70 pl-4">
              {items.map((a) => (
                <div key={a.rank} className="glass glass-hover relative rounded-2xl p-4">
                  <span className={cn("absolute -left-[21px] top-5 size-2.5 rounded-full", ci === 0 ? "bg-gold" : "bg-tech")} />
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold leading-snug">{a.title}</div>
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        a.owner === "operator" ? "bg-gold/15 text-gold" : "bg-tech/15 text-tech",
                      )}
                    >
                      {a.owner === "operator" ? <Briefcase className="size-3" /> : <Rocket className="size-3" />}
                      {a.owner === "operator" ? "Operator" : "Startup"}
                    </span>
                  </div>
                  {a.detail && <p className="mt-2 text-xs leading-relaxed text-ice/75">{a.detail}</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.deadline_date && <span className="rounded-md bg-warn/15 px-2 py-0.5 text-[10px] font-semibold text-warn">Due {a.deadline_date}</span>}
                    {a.unlocks.slice(0, 3).map((u) => (
                      <span key={u} className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-ice/80">Unlocks: {u}</span>
                    ))}
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
