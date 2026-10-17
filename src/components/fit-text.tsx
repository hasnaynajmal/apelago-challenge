"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Text that fills whatever height its box has and ends with an ellipsis when it doesn't fit.
 * The parent decides the height (e.g. a flex-1 column); on small screens it falls back to `fallbackLines`.
 */
export function FitText({ text, className, fallbackLines = 4 }: { text: string; className?: string; fallbackLines?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 22;
      const h = el.clientHeight;
      setLines(h > lh ? Math.max(3, Math.floor(h / lh)) : null);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clamp = lines ?? fallbackLines;
  return (
    <div ref={box} className={cn("relative min-h-[3lh] leading-relaxed", className)}>
      <p
        title={text}
        className="overflow-hidden lg:absolute lg:inset-x-0 lg:top-0"
        style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: clamp }}
      >
        {text}
      </p>
    </div>
  );
}
