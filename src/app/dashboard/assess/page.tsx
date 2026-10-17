import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { BrainCircuit, CheckCircle2, ChevronRight, CircleAlert, Globe, Loader2, Network, Route } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveLens } from "@/lib/lens";
import { getRecentRuns } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/v2/page-header";
import { IntakeForm } from "./intake-form";

const OUTPUTS = [
  { icon: Globe, title: "Research", text: "Web evidence with sources" },
  { icon: BrainCircuit, title: "Readiness", text: "Tech, business, impact and investment levels" },
  { icon: Network, title: "Matches", text: "Ranked investors, grants and partners" },
  { icon: Route, title: "Plan", text: "Warm intro paths and next steps" },
];

const STEPS = [
  { title: "Research", time: "~20 s", text: "The Scout searches the web and builds a profile with sources." },
  { title: "Readiness", time: "~5 s", text: "Four assessors score the levels; the Second Opinion double-checks them." },
  { title: "Matching", time: "~1 s", text: "Investors, grants and partners are ranked, and warm paths are traced." },
  { title: "Explain", time: "~10 s", text: "Each top match gets a one-line reason." },
  { title: "Plan", time: "~10 s", text: "A prioritised action plan with owners and deadlines." },
  { title: "Score", time: "instant", text: "A 0–100 score and group for every thesis." },
];

export default function AssessPage({ searchParams }: PageProps<"/dashboard/assess">) {
  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <PageHeader title="Assess a startup" sub="Add a venture by name. The Deep Panel researches it and scores it for every thesis in about a minute." />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
            <FormWithLens searchParams={searchParams} />
          </Suspense>
          <div className="card-surface p-5">
            <h2 className="text-[15px] font-semibold">What happens when you press Run</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">You can watch each step live; the venture page opens by itself at the end.</p>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              {STEPS.map((st, i) => (
                <li key={st.title} className="rounded-xl border bg-zinc-50/60 p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-white">{i + 1}</span>
                    <span className="text-[13px] font-semibold">{st.title}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground tabular">{st.time}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{st.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-5">
            <h2 className="text-[15px] font-semibold">What you get</h2>
            <ul className="mt-3 space-y-3">
              {OUTPUTS.map((o) => (
                <li key={o.title} className="flex items-start gap-3">
                  <span className="icon-tile size-9 bg-navy-soft text-navy">
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
        <h2 className="text-[15px] font-semibold">Recent assessments</h2>
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
