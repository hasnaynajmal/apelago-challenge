"use client";

// Makes switching the "Evaluate for" thesis feel like an update: the page dims and a progress bar runs while the new
// scores load, then the content fades back in and a toast confirms what changed.
import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LENSES } from "@/lib/lens";
import { cn } from "@/lib/utils";

type Ctx = { pending: boolean; target: string | null; switchLens: (lensId: string, pathname: string, search: string) => void };
const LensTransition = createContext<Ctx>({ pending: false, target: null, switchLens: () => {} });
export const useLensTransition = () => useContext(LensTransition);

export function LensTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<string | null>(null);

  const switchLens = (lensId: string, pathname: string, search: string) => {
    const next = new URLSearchParams(search);
    if (next.get("lens") === lensId) return;
    next.set("lens", lensId);
    setTarget(lensId);
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return <LensTransition.Provider value={{ pending, target, switchLens }}>{children}</LensTransition.Provider>;
}

/** Wraps the page content: dims while the new thesis loads, fades in when it lands, then confirms with a toast. */
export function LensContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending, target } = useLensTransition();
  const ref = useRef<HTMLDivElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;
    ref.current?.animate(
      [{ opacity: 0.35, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
      { duration: 420, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
    );
    const lens = LENSES.find((l) => l.id === target);
    if (lens) toast.success(`Now evaluating for ${lens.label}`, { description: "Scores, groups, rankings and matches updated." });
  }, [pending, target]);

  return (
    <div ref={ref} aria-busy={pending} className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-45", className)}>
      {children}
    </div>
  );
}

/** Thin indeterminate bar shown under the topbar while a thesis switch loads. */
export function LensProgressBar() {
  const { pending } = useLensTransition();
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 -bottom-px h-0.5 overflow-hidden transition-opacity", pending ? "opacity-100" : "opacity-0")}>
      <div className="lens-progress h-full w-1/3 rounded-full bg-navy" />
    </div>
  );
}
