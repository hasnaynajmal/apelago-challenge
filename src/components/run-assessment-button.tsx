"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function RunAssessmentButton({ startupId, lens, rerun, compact }: { startupId: string; lens: string; rerun?: boolean; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const start = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to start");
      router.push(`/dashboard/runs/${json.runId}?startup=${startupId}&lens=${lens}`);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={start} disabled={busy} variant="outline" size="icon" className="size-8 shrink-0 rounded-lg" aria-label="Re-run committee">
            {busy ? <Loader2 className="animate-spin" /> : <RotateCw />}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="text-sm">Re-run the committee (uses the API, ~1 min)</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button onClick={start} disabled={busy} variant={rerun ? "outline" : "default"} className="rounded-full">
      {busy ? <Loader2 className="animate-spin" /> : rerun ? <RotateCw /> : <Play />}
      {rerun ? "Re-run committee" : "Run the AI committee"}
    </Button>
  );
}
