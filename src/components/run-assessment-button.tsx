"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RunAssessmentButton({ startupId, lens, rerun }: { startupId: string; lens: string; rerun?: boolean }) {
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
      router.push(`/runs/${json.runId}?startup=${startupId}&lens=${lens}`);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <Button onClick={start} disabled={busy} variant={rerun ? "outline" : "default"} className="rounded-full">
      {busy ? <Loader2 className="animate-spin" /> : rerun ? <RotateCw /> : <Play />}
      {rerun ? "Re-run committee" : "Run the AI committee"}
    </Button>
  );
}
