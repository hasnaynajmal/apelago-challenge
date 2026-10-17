"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlurText from "@/components/reactbits/BlurText";
import CountUp from "@/components/reactbits/CountUp";
import DotGrid from "@/components/reactbits/DotGrid";
import RotatingText from "@/components/reactbits/RotatingText";
import ShinyText from "@/components/reactbits/ShinyText";

export interface HeroStats {
  assessed: number;
  total: number;
  opportunities: number;
  warmPaths: number;
  deadlines: number;
}

export function Hero({ stats }: { stats: HeroStats }) {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ maskImage: "radial-gradient(ellipse 70% 80% at 50% 30%, black 20%, transparent 75%)" }}
      >
        <DotGrid dotSize={2} gap={26} baseColor="#e4e4e7" activeColor="#002444" proximity={110} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3.5 py-1.5 text-sm shadow-sm">
          <span className="size-1.5 rounded-full bg-gold" />
          <ShinyText text="A'Pelago × Redstone Blue · venture intelligence for the blue economy" speed={3} color="#6b6b74" shineColor="#002444" />
        </div>

        <h1 className="mx-auto mt-8 max-w-5xl text-5xl font-semibold leading-[1.1] tracking-[-0.035em] text-foreground sm:text-[64px]">
          <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <BlurText text="Find the next best" animateBy="words" delay={90} className="justify-center" />
            <RotatingText
              texts={["investor", "grant", "pilot partner", "client"]}
              mainClassName="overflow-hidden rounded-2xl bg-navy px-4 pb-1.5 pt-1 text-white"
              staggerFrom="last"
              staggerDuration={0.02}
              rotationInterval={2400}
            />
          </span>
          <span className="mt-1 block">for every ocean startup.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Deep Panel</span>, a team of AI agents, scores each venture on technology, business, ocean impact and investment readiness,
          then maps the warm paths to the funding and partners that move it forward.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="h-11 rounded-full px-6 text-[15px]">
            <Link href="/dashboard">Open dashboard <ArrowRight /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 rounded-full bg-white px-6 text-[15px]">
            <Link href="/dashboard/assess">Assess a startup</Link>
          </Button>
        </div>

        <dl className="mx-auto mt-12 grid max-w-4xl grid-cols-2 divide-x divide-y rounded-2xl border bg-white text-left shadow-sm sm:grid-cols-4 sm:divide-y-0">
          <Stat label="Ventures assessed" value={stats.assessed} suffix={`/${stats.total}`} />
          <Stat label="Investors, grants & partners" value={stats.opportunities} />
          <Stat label="Warm intro paths" value={stats.warmPaths} />
          <Stat label="Deadlines in 60 days" value={stats.deadlines} />
        </dl>
      </div>
    </section>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="px-6 py-5">
      <dd className="text-3xl font-semibold tracking-tight tabular">
        <CountUp to={value} duration={1.2} />
        {suffix && <span className="text-muted-foreground">{suffix}</span>}
      </dd>
      <dt className="mt-1 text-sm text-muted-foreground">{label}</dt>
    </div>
  );
}
