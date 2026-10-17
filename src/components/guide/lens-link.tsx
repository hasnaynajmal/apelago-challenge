"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/** A link that keeps the current "Evaluate for" thesis. Falls back to a plain link while the URL is unknown. */
export function LensLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Suspense fallback={<Link href={href} className={className}>{children}</Link>}>
      <WithLens href={href} className={className}>{children}</WithLens>
    </Suspense>
  );
}

function WithLens({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const lens = useSearchParams().get("lens");
  const [path, hash] = href.split("#");
  const url = lens ? `${path}${path.includes("?") ? "&" : "?"}lens=${lens}${hash ? `#${hash}` : ""}` : href;
  return <Link href={url} className={className}>{children}</Link>;
}
