import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ocean Opportunity Radar · A'Pelago × Redstone Blue",
  description: "Venture intelligence for the blue economy: readiness, thesis fit, and the next best investors, grants and partners.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider delayDuration={150}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t py-8 text-center text-sm text-muted-foreground">
            Ocean Opportunity Radar · built for A'Pelago × Redstone Blue at JunctionX Turku
          </footer>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
