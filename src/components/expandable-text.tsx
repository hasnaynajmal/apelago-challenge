"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Text clamped to a few lines with a Read more / Show less toggle. */
export function ExpandableText({ text, lines = 2, className }: { text: string; lines?: 2 | 3; className?: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 180;
  return (
    <div className={className}>
      <p className={cn("leading-relaxed", !open && long && (lines === 2 ? "line-clamp-2" : "line-clamp-3"))}>{text}</p>
      {long && (
        <button onClick={() => setOpen(!open)} className="mt-1 text-sm font-medium text-navy hover:underline">
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
