import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const urbanist = localFont({
  src: "./fonts/Urbanist-VariableFont.woff2",
  variable: "--font-urbanist",
  weight: "100 900",
  display: "swap",
});

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ocean Opportunity Radar · A'Pelago × Redstone Blue",
  description: "Venture intelligence for the blue economy: readiness, thesis fit, and the next best investors, grants and partners.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${urbanist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider delayDuration={150}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
