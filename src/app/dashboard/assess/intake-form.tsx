"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CountrySelect } from "@/components/country-select";
import { Flag } from "@/components/country";

const EXAMPLES = [
  { name: "Clewat", country: "FI" },
  { name: "Sulapac", country: "FI" },
  { name: "Kelluu", country: "FI" },
];

export function IntakeForm({ lens }: { lens: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [oneLiner, setOneLiner] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let site = website.trim();
    if (site && !/^https?:\/\//.test(site)) site = `https://${site}`;
    setBusy(true);
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), website: site || undefined, oneLiner: oneLiner.trim() || undefined, country: country || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to start");
      router.push(`/dashboard/runs/${json.runId}?startup=${json.startupId}&lens=${lens}`);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card-surface p-7 shadow-xl shadow-zinc-200/50">
      <div className="space-y-5">
        <label className="block space-y-2">
          <span className="block text-sm font-medium leading-5">Startup name</span>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="e.g. Clewat" className="h-12 rounded-xl pl-10 text-sm" />
          </div>
        </label>

        <div className="grid gap-5 sm:grid-cols-[1fr_220px]">
          <label className="block space-y-2">
            <span className="block text-sm font-medium leading-5">Website <span className="font-normal text-muted-foreground">· optional</span></span>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="company.com" className="h-12 rounded-xl pl-10 text-sm" />
            </div>
          </label>
          <div className="space-y-2">
            <span className="block text-sm font-medium leading-5">Country</span>
            <CountrySelect value={country} onChange={setCountry} />
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium">What do they do? <span className="font-normal text-muted-foreground">· optional, the agents research the rest</span></span>
          <Textarea value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} rows={2} placeholder="One line about the venture" className="min-h-20 rounded-xl text-sm" />
        </label>
      </div>

      <Button type="submit" size="lg" disabled={busy || name.trim().length < 2} className="mt-6 h-12 w-full rounded-full text-sm">
        {busy ? <Loader2 className="animate-spin" /> : null} Run the assessment <ArrowRight />
      </Button>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>Try an example:</span>
        {EXAMPLES.map((e) => (
          <button
            key={e.name}
            type="button"
            onClick={() => { setName(e.name); setCountry(e.country); }}
            className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-zinc-700 transition-colors hover:border-navy hover:text-navy"
          >
            <Flag code={e.country} /> {e.name}
          </button>
        ))}
      </div>
    </form>
  );
}
