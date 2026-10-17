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
        <nav className="hidden items-center gap-6 text-[15px] text-muted-foreground md:flex">
          <Link href="/#pipeline" className="transition-colors hover:text-foreground">Pipeline</Link>
          <Link href="/#deadlines" className="transition-colors hover:text-foreground">Deadlines</Link>
        </nav>
        <div className="ml-auto">
          <Button asChild size="lg" className="rounded-full px-5">
            <Link href="/intake">Assess a startup</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
