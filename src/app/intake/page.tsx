import { Suspense } from "react";
import { BrainCircuit, Globe, Network, Route } from "lucide-react";
import { resolveLens } from "@/lib/lens";
import { IntakeForm } from "./intake-form";

const STEPS = [
  { icon: Globe, title: "Research", text: "Reads the web and collects evidence with sources", time: "≈20 s" },
  { icon: BrainCircuit, title: "Assess", text: "Scores technology, business, impact and investment readiness", time: "≈15 s" },
  { icon: Network, title: "Match", text: "Ranks investors, grants and partners with reasons", time: "≈10 s" },
  { icon: Route, title: "Plan", text: "Finds warm intro paths and writes next steps", time: "≈15 s" },
];

export default function IntakePage({ searchParams }: PageProps<"/intake">) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="text-center">
        <p className="eyebrow">New assessment</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Assess a new venture</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Enter a name. In about a minute you get readiness, thesis fit for Redstone Blue and A'Pelago, ranked opportunities and a plan.
        </p>
      </div>

      <div className="mt-10">
        <Suspense>
          <FormWithLens searchParams={searchParams} />
        </Suspense>
      </div>

      <div className="mt-14">
        <h2 className="text-center text-sm font-medium text-muted-foreground">What happens in the next minute</h2>
        <ol className="relative mt-6 grid gap-6 sm:grid-cols-4">
          <div className="absolute left-[12.5%] right-[12.5%] top-5 hidden h-px bg-border sm:block" aria-hidden />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full border bg-white text-navy shadow-sm">
                <s.icon className="size-[18px]" />
              </div>
              <div className="mt-3 text-[15px] font-semibold">{i + 1}. {s.title}</div>
              <div className="mx-auto mt-1 max-w-44 text-sm leading-snug text-muted-foreground">{s.text}</div>
              <div className="mt-1.5 text-xs text-muted-foreground tabular">{s.time}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

async function FormWithLens({ searchParams }: { searchParams: PageProps<"/intake">["searchParams"] }) {
  return <IntakeForm lens={resolveLens((await searchParams).lens)} />;
}
