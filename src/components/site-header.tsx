import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LensSwitcher } from "./lens-switcher";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-navy-900/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/apelago-logo-white.svg" alt="A'Pelago" width={118} height={18} priority />
          <span className="hidden h-5 w-px bg-border sm:block" />
          <span className="hidden text-sm font-semibold tracking-wide text-ice sm:block">
            Ocean Opportunity <span className="text-gold">Radar</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/" className="rounded-md px-3 py-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground">
            Radar
          </Link>
          <Link href="/intake" className="rounded-md px-3 py-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground">
            Assess a startup
          </Link>
        </nav>
        <div className="ml-auto">
          <Suspense fallback={<div className="h-9 w-72 rounded-lg bg-muted/40" />}>
            <LensSwitcher />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
