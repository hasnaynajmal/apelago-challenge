import { Suspense } from "react";
import { BrainCircuit, Globe, Network, Route } from "lucide-react";
import { resolveLens } from "@/lib/lens";
import { IntakeForm } from "./intake-form";

const STEPS = [
  { icon: Globe, title: "Research", text: "Web research builds an evidence pack with sources." },
  { icon: BrainCircuit, title: "Assess", text: "Technology, business, impact and investment readiness." },
  { icon: Network, title: "Match", text: "Investors, grants and partners, each with reasons." },
  { icon: Route, title: "Plan", text: "Warm intro paths and concrete next steps." },
];

export default function IntakePage({ searchParams }: PageProps<"/intake">) {
  return (
    <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-14 lg:grid-cols-[1fr_520px]">
      <div>
        <p className="eyebrow">New assessment</p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-[-0.03em]">Put a venture on the radar</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Add a name and a website. In about a minute you get readiness levels, thesis fit for Redstone Blue and A'Pelago,
          ranked opportunities and a concrete plan.
        </p>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card-surface flex gap-3 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-navy">
                <s.icon className="size-[18px]" />
              </div>
              <div>
                <div className="text-[15px] font-semibold">{i + 1}. {s.title}</div>
                <div className="mt-0.5 text-sm leading-snug text-muted-foreground">{s.text}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <Suspense>
        <FormWithLens searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FormWithLens({ searchParams }: { searchParams: PageProps<"/intake">["searchParams"] }) {
  return <IntakeForm lens={resolveLens((await searchParams).lens)} />;
}
