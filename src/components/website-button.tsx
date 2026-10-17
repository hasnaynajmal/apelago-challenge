import { ExternalLink, Globe } from "lucide-react";

/** Venture website as a clear button with favicon; always opens in a new tab. */
export function WebsiteButton({ url }: { url: string }) {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    host = url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open ${host} in a new tab`}
      className="group inline-flex shrink-0 items-center gap-2 rounded-full border bg-white py-1.5 pl-1.5 pr-3 text-sm shadow-sm transition-colors hover:border-zinc-300 hover:bg-muted/40"
    >
      <span className="relative flex size-6 items-center justify-center overflow-hidden rounded-full bg-muted">
        <Globe className="absolute size-3.5 text-muted-foreground" />
        {/* eslint-disable-next-line @next/next/no-img-element -- remote favicon, decorative */}
        <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} alt="" className="relative size-4 rounded-sm" loading="lazy" />
      </span>
      <span className="font-medium text-foreground">{host}</span>
      <ExternalLink className="size-3.5 text-muted-foreground transition group-hover:text-navy" />
    </a>
  );
}
