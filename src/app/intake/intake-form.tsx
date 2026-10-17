"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
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

  const field = "h-12 rounded-xl bg-white text-[15px]";
  return (
    <form onSubmit={submit} className="card-surface space-y-5 p-8 shadow-lg shadow-zinc-200/60">
      <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
        <label className="space-y-2">
          <span className="text-sm font-medium">Startup name</span>
          <Input name="name" required minLength={2} placeholder="e.g. Hailia" className={field} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Country</span>
          <Input name="country" maxLength={2} placeholder="FI" className={`${field} uppercase`} />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Website</span>
        <Input name="website" placeholder="https://…" className={field} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">What do they do? <span className="font-normal text-muted-foreground">Optional</span></span>
        <Textarea name="oneLiner" rows={3} placeholder="One line about the venture" className="rounded-xl bg-white text-[15px]" />
      </label>
      <Button type="submit" size="lg" disabled={busy} className="h-12 w-full rounded-full text-[15px]">
        {busy ? <Loader2 className="animate-spin" /> : null} Run the assessment <ArrowRight />
      </Button>
      <p className="text-center text-sm text-muted-foreground">Takes about a minute. You can watch each agent work.</p>
    </form>
  );
}
