import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/apelago-logo-navy.svg" alt="A'Pelago" width={112} height={17} priority />
          <span className="h-4 w-px bg-border" />
          <span className="text-[15px] font-medium text-foreground">Opportunity Radar</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="lg" className="rounded-full px-4 text-[15px]">
            <Link href="/dashboard/assess">Assess a startup</Link>
          </Button>
          <Button asChild size="lg" className="rounded-full px-5 text-[15px]">
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
