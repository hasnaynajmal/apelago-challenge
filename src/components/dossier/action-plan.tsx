import type { ActionView } from "@/lib/queries";
import { cn } from "@/lib/utils";

const COLS = [
  { id: "now", label: "This week" },
  { id: "30d", label: "Next 30 days" },
  { id: "90d", label: "Next 90 days" },
] as const;

export function ActionPlan({ actions }: { actions: ActionView[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {COLS.map((col, ci) => {
        const items = actions.filter((a) => a.horizon === col.id);
        return (
          <div key={col.id}>
            <div className="mb-4 flex items-center gap-2.5">
              <span className={cn("flex size-7 items-center justify-center rounded-full text-sm font-semibold", ci === 0 ? "bg-navy text-white" : "bg-muted text-zinc-600")}>
                {ci + 1}
              </span>
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="text-sm text-muted-foreground">{items.length}</span>
            </div>
            <div className="space-y-3">
              {items.map((a) => (
                <div key={a.rank} className="card-surface card-hover p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold leading-snug">{a.title}</div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", a.owner === "operator" ? "bg-navy-soft text-navy" : "bg-muted text-zinc-600")}>
                      {a.owner === "operator" ? "Operator" : "Startup"}
                    </span>
                  </div>
                  {a.detail && <p title={a.detail} className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-zinc-600">{a.detail}</p>}
                  {(a.deadline_date || a.unlocks.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {a.deadline_date && (
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Due {new Date(a.deadline_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {a.unlocks.slice(0, 2).map((u) => (
                        <span key={u} className="rounded-md bg-muted px-2 py-0.5 text-xs text-zinc-600">Unlocks {u}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-muted-foreground">Nothing scheduled.</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
