"use client";

import CountUp from "@/components/reactbits/CountUp";

export function PromiseScore({ value }: { value: number }) {
  return (
    <div className="mt-1 flex items-baseline gap-1">
      <span className="text-4xl font-semibold tracking-tight tabular">
        <CountUp to={Math.round(value)} duration={1} />
      </span>
      <span className="text-base text-muted-foreground">/100</span>
    </div>
  );
}
