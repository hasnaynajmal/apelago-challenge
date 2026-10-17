"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { LENSES, resolveLens } from "@/lib/lens";
import { cn } from "@/lib/utils";

export function LensSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = resolveLens(params.get("lens") ?? undefined);

  const select = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("lens", id);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-navy-950/40 p-1" role="tablist" aria-label="Thesis lens">
      {LENSES.map((l) => (
        <button
          key={l.id}
          role="tab"
          aria-selected={active === l.id}
          onClick={() => select(l.id)}
          className={cn(
            "relative rounded-lg px-3 py-1.5 text-left text-xs transition",
            active === l.id ? "text-navy-900" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {active === l.id && (
            <motion.span layoutId="lens-pill" className="absolute inset-0 rounded-lg bg-gold" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
          )}
          <span className="relative block font-semibold leading-tight">{l.label}</span>
          <span className={cn("relative block text-[10px] leading-tight", active === l.id ? "text-navy-900/70" : "text-muted-foreground/70")}>
            {l.kind}
          </span>
        </button>
      ))}
    </div>
  );
}
