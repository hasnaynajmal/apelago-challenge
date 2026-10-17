import Link from "next/link";
import { CalendarClock, ChevronRight, ListChecks, Route } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Move {
  kind: "deadline" | "intro" | "action";
  title: string;
  detail: string;
  href: string;
  tag: string;
  urgent?: boolean;
}

const KIND = {
  deadline: { icon: CalendarClock, cls: "bg-amber-50 text-amber-700" },
  intro: { icon: Route, cls: "bg-gold-soft text-gold-ink" },
  action: { icon: ListChecks, cls: "bg-navy-soft text-navy" },
} as const;

/** The portfolio-wide to-do list: deadlines, warm intros and each top venture's next step, in priority order. */
export function WeeklyMoves({ moves }: { moves: Move[] }) {
  return (
    <div className="card-surface">
      <div className="border-b px-5 py-4">
        <h2 className="text-sm font-semibold">This week&apos;s moves</h2>
        <p className="text-sm text-muted-foreground">What the team should do next across the whole portfolio</p>
      </div>
      <ol className="divide-y">
        {moves.map((m, i) => {
          const k = KIND[m.kind];
          return (
            <li key={i}>
              <Link href={m.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50">
                <span className="w-4 text-right text-xs text-muted-foreground tabular">{i + 1}</span>
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", k.cls)}>
                  <k.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium leading-snug">{m.title}</span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">{m.detail}</span>
                </span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", m.urgent ? "bg-amber-50 text-amber-700" : "bg-muted text-zinc-600")}>
                  {m.tag}
                </span>
                <ChevronRight className="size-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
