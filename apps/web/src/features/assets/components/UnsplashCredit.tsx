import type { UnsplashAttribution } from "@repo/contracts";

interface UnsplashCreditProps {
  attribution: UnsplashAttribution;
}

const LINK_CLASS = "underline decoration-dotted underline-offset-2 hover:text-foreground";

export function UnsplashCredit({ attribution }: UnsplashCreditProps) {
  return (
    <p className="text-[11px] text-muted">
      Photo by{" "}
      <a href={attribution.photographerUrl} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        {attribution.photographerName}
      </a>{" "}
      on{" "}
      <a href={attribution.photoUrl} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        Unsplash
      </a>
    </p>
  );
}
