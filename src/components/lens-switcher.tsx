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
    <div className="inline-flex items-center gap-1 rounded-full border bg-muted/60 p-1" role="tablist" aria-label="Thesis lens">
      {LENSES.map((l) => (
        <button
          key={l.id}
          role="tab"
          aria-selected={active === l.id}
          onClick={() => select(l.id)}
          className={cn(
            "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
            active === l.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {active === l.id && (
            <motion.span
              layoutId="lens-pill"
              className="absolute inset-0 rounded-full bg-white shadow-sm ring-1 ring-black/5"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative whitespace-nowrap" title={l.kind}>{l.label}</span>
        </button>
      ))}
    </div>
  );
}
