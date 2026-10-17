import { Fragment, Suspense } from "react";
import { BrainCircuit, ChevronRight, Globe, Network, Route } from "lucide-react";
import { resolveLens } from "@/lib/lens";
import { IntakeForm } from "./intake-form";

const STEPS = [
  { icon: Globe, title: "Research", text: "the web" },
  { icon: BrainCircuit, title: "Assess", text: "4 readiness scores" },
  { icon: Network, title: "Match", text: "116 funders & partners" },
  { icon: Route, title: "Plan", text: "next steps" },
];

export default function IntakePage({ searchParams }: PageProps<"/dashboard/assess">) {
  return (
    <div className="mx-auto max-w-5xl py-4">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-[-0.03em]">Assess a new venture</h1>
        <p className="mx-auto mt-3 max-w-xl text-[17px] text-muted-foreground">
          Enter a name. In about a minute you get readiness, thesis fit, ranked opportunities and a plan.
        </p>
      </div>

      {/* What happens — compact, above the form so it is always visible */}
      <ol className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
        {STEPS.map((s, i) => (
          <Fragment key={s.title}>
            <li className="flex items-center gap-2 rounded-full border bg-white py-1.5 pl-1.5 pr-3.5 text-sm shadow-sm">
              <span className="flex size-6 items-center justify-center rounded-full bg-navy-soft text-navy">
                <s.icon className="size-3.5" />
              </span>
              <span className="font-medium">{s.title}</span>
              <span className="hidden text-muted-foreground sm:inline">{s.text}</span>
            </li>
            {i < STEPS.length - 1 && <ChevronRight className="size-4 text-zinc-300" aria-hidden />}
          </Fragment>
        ))}
      </ol>

      <div className="mx-auto mt-8 max-w-3xl">
        <Suspense>
          <FormWithLens searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function FormWithLens({ searchParams }: { searchParams: PageProps<"/dashboard/assess">["searchParams"] }) {
  return <IntakeForm lens={resolveLens((await searchParams).lens)} />;
}
