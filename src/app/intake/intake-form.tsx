"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function IntakeForm({ lens }: { lens: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      name: String(f.get("name") ?? "").trim(),
      website: String(f.get("website") ?? "").trim() || undefined,
      oneLiner: String(f.get("oneLiner") ?? "").trim() || undefined,
      country: String(f.get("country") ?? "").trim().toUpperCase() || undefined,
    };
    if (body.website && !/^https?:\/\//.test(body.website)) body.website = `https://${body.website}`;
    setBusy(true);
    try {
      const res = await fetch("/api/assess", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to start");
      router.push(`/runs/${json.runId}?startup=${json.startupId}&lens=${lens}`);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass space-y-4 rounded-3xl p-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <label className="space-y-1.5 text-sm">
          <span className="text-muted-foreground">Startup name *</span>
          <Input name="name" required minLength={2} placeholder="e.g. Hailia" className="h-11 bg-navy-950/40" />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-muted-foreground">Country</span>
          <Input name="country" maxLength={2} placeholder="FI" className="h-11 bg-navy-950/40 uppercase" />
        </label>
      </div>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted-foreground">Website</span>
        <Input name="website" placeholder="https://…" className="h-11 bg-navy-950/40" />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted-foreground">What do they do? (optional — the Scout researches the rest)</span>
        <Textarea name="oneLiner" rows={3} placeholder="One line about the venture" className="bg-navy-950/40" />
      </label>
      <Button type="submit" size="lg" disabled={busy} className="w-full shadow-[0_0_28px_-6px_#dfae32]">
        {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Run the AI committee
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        Web research → 4 readiness assessors + calibration → matching across the ecosystem → hidden connections → action plan · ~1 min
      </p>
    </form>
  );
}
