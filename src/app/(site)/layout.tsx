import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Ocean Opportunity Radar · built for A'Pelago × Redstone Blue at JunctionX Turku
      </footer>
    </div>
  );
}
