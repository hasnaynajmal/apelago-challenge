import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { BrainCircuit, CheckCircle2, ChevronRight, CircleAlert, Globe, Loader2, Network, Route } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveLens } from "@/lib/lens";
import { getRecentRuns } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { IntakeForm } from "./intake-form";

const OUTPUTS = [
  { icon: Globe, title: "Research", text: "Web evidence with sources" },
  { icon: BrainCircuit, title: "Readiness", text: "Tech, business, impact and investment levels" },
  { icon: Network, title: "Matches", text: "Ranked investors, grants and partners" },
  { icon: Route, title: "Plan", text: "Warm intro paths and next steps" },
];

export default function AssessPage({ searchParams }: PageProps<"/dashboard/assess">) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assess a startup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a venture by name. The agent committee researches it and scores it for every thesis — about a minute.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
          <FormWithLens searchParams={searchParams} />
        </Suspense>

        <div className="space-y-6">
          <div className="card-surface p-5">
            <h2 className="text-sm font-semibold">What you get</h2>
            <ul className="mt-3 space-y-3">
              {OUTPUTS.map((o) => (
                <li key={o.title} className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-navy-soft text-navy">
                    <o.icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{o.title}</span>
                    <span className="block text-xs text-muted-foreground">{o.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Suspense fallback={<Skeleton className="h-60 rounded-2xl" />}>
            <RecentRuns searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function FormWithLens({ searchParams }: { searchParams: PageProps<"/dashboard/assess">["searchParams"] }) {
  return <IntakeForm lens={resolveLens((await searchParams).lens)} />;
}

async function RecentRuns({ searchParams }: { searchParams: PageProps<"/dashboard/assess">["searchParams"] }) {
  await connection();
  const lens = resolveLens((await searchParams).lens);
  const runs = await getRecentRuns(6);
  const ago = (iso: string) => {
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
  };
  return (
    <div className="card-surface">
      <div className="border-b px-5 py-4">
        <h2 className="text-sm font-semibold">Recent assessments</h2>
      </div>
      <ul className="divide-y">
        {runs.map((r) => (
          <li key={r.id}>
            <Link
              href={r.status === "done" ? `/dashboard/startups/${r.startupId}?lens=${lens}` : `/dashboard/runs/${r.id}?lens=${lens}`}
              className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
            >
              {r.status === "done" ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : r.status === "error" ? (
                <CircleAlert className="size-4 shrink-0 text-red-600" />
              ) : (
                <Loader2 className="size-4 shrink-0 animate-spin text-navy" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{r.name}</span>
                <span className={cn("block text-xs", r.status === "error" ? "text-red-600" : "text-muted-foreground")}>
                  {r.status === "error" ? "Failed" : r.status === "running" ? "Running…" : `Done in ${r.seconds}s`} · {ago(r.startedAt)}
                </span>
              </span>
              <ChevronRight className="size-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500" />
            </Link>
          </li>
        ))}
        {runs.length === 0 && <li className="px-5 py-6 text-sm text-muted-foreground">No assessments yet.</li>}
      </ul>
    </div>
  );
}
