"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COUNTRIES, Flag, countryName } from "@/components/country";
import { cn } from "@/lib/utils";

const NORDIC_BALTIC = new Set(["FI", "SE", "NO", "DK", "IS", "EE", "LV", "LT"]);

export function CountrySelect({ value, onChange, className }: { value: string; onChange: (code: string) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const pick = (code: string) => {
    onChange(code === value ? "" : code);
    setOpen(false);
  };
  const item = (code: string, name: string) => (
    <CommandItem key={code} value={`${name} ${code}`} onSelect={() => pick(code)} className="gap-2.5 py-1.5 text-sm">
      <Flag code={code} className="h-4" />
      <span className="flex-1">{name}</span>
      <Check className={cn("size-4", value === code ? "opacity-100" : "opacity-0")} />
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center gap-2.5 rounded-lg border border-input bg-white px-3 text-left text-sm transition-colors hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            className,
          )}
        >
          {value ? (
            <>
              <Flag code={value} className="h-4" />
              <span className="flex-1 truncate">{countryName(value)}</span>
            </>
          ) : (
            <span className="flex-1 text-muted-foreground">Select country</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country…" className="text-sm" />
          <CommandList className="max-h-72">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup heading="Nordics & Baltics">
              {COUNTRIES.filter(([c]) => NORDIC_BALTIC.has(c)).map(([c, n]) => item(c, n))}
            </CommandGroup>
            <CommandGroup heading="All countries">
              {COUNTRIES.filter(([c]) => !NORDIC_BALTIC.has(c)).map(([c, n]) => item(c, n))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
