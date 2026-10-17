import { Suspense } from "react";
import { BrainCircuit, Globe, Network, Route } from "lucide-react";
import { resolveLens } from "@/lib/lens";
import { IntakeForm } from "./intake-form";

const STEPS = [
  { icon: Globe, title: "Scout", text: "Searches the web and builds an evidence pack with sources." },
  { icon: BrainCircuit, title: "Committee", text: "TRL, BRL, Ocean Impact and Investment agents assess in parallel; Jev calibrates." },
  { icon: Network, title: "Matchmaker", text: "Scores 116 investors, grants and partners with reasons and blockers." },
  { icon: Route, title: "Connector & Strategist", text: "Finds warm paths, unlocks and consortia, then writes the action plan." },
];

export default function IntakePage({ searchParams }: PageProps<"/intake">) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Live intake</div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Put a new venture on the radar</h1>
          <p className="mt-3 text-ice/75">
            Give the committee a name and a website. Within a minute you get readiness levels with calibrated confidence,
            thesis fit for Redstone Blue and A'Pelago, ranked opportunities and a concrete plan.
          </p>
        </div>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="glass flex gap-4 rounded-2xl p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-gold">
                <s.icon className="size-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{i + 1}. {s.title}</div>
                <div className="text-xs text-muted-foreground">{s.text}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="lg:pt-16">
        <Suspense>
          <FormWithLens searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function FormWithLens({ searchParams }: { searchParams: PageProps<"/intake">["searchParams"] }) {
  return <IntakeForm lens={resolveLens((await searchParams).lens)} />;
}
