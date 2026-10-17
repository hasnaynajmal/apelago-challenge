import { Suspense } from "react";
import { BrainCircuit, Globe, Network, Route } from "lucide-react";
import { resolveLens } from "@/lib/lens";
import { IntakeForm } from "./intake-form";

const STEPS = [
  { icon: Globe, title: "Research", text: "The Scout searches the web and builds an evidence pack with sources." },
  { icon: BrainCircuit, title: "Assess", text: "Four agents score technology, business, ocean impact and investment readiness." },
  { icon: Network, title: "Match", text: "Every investor, grant and partner is scored with reasons and blockers." },
  { icon: Route, title: "Plan", text: "Warm intro paths and unlocks are found, then turned into next steps." },
];

export default function IntakePage({ searchParams }: PageProps<"/intake">) {
  return (
    <div className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-2">
      <div>
        <p className="eyebrow">New assessment</p>
        <h1 className="mt-2 text-5xl font-semibold leading-tight tracking-[-0.035em]">Put a venture on the radar</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Add a name and a website. In about a minute you get readiness levels with confidence, thesis fit for Redstone Blue and A'Pelago,
          ranked opportunities and a concrete plan.
        </p>
        <ol className="mt-10 space-y-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-white text-navy shadow-sm">
                <s.icon className="size-5" />
              </div>
              <div>
                <div className="text-base font-semibold">{i + 1}. {s.title}</div>
                <div className="mt-0.5 text-[15px] text-muted-foreground">{s.text}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="lg:pt-10">
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
