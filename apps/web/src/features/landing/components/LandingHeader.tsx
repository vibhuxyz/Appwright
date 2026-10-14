import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { NAV_LINKS } from "../data/content";

interface LandingHeaderProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export function LandingHeader({ onLoginClick, onSignupClick }: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-background/82 backdrop-blur-md">
      <div className="mx-auto flex max-w-350 flex-wrap items-center gap-x-7 gap-y-3 px-6 py-3">
        <a href="#top" className="flex flex-none items-center gap-2.5">
          <span className="grid size-[26px] place-items-center rounded-[7px] bg-lime text-[15px] font-black text-background-deep">
            A
          </span>
          <span className="text-[17px] font-bold tracking-tight">appwright</span>
        </a>

        <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2.5 text-sm text-foreground-secondary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={
                link.label === "Product" ? "font-semibold text-lime" : undefined
              }
            >
              <span className="inline-flex items-center gap-1.5">
                {link.label}
                {link.badge && (
                  <Badge tone={link.badge.tone} className="rounded-md px-1.5 py-0 text-[10px] font-bold">
                    {link.badge.label}
                  </Badge>
                )}
              </span>
            </a>
          ))}
        </nav>

        <div className="flex flex-none items-center gap-2.5">
          <a
            href="#platform"
            className="rounded-[9px] border border-border px-3.5 py-2 text-[13px] font-semibold text-foreground"
          >
            Docs
          </a>
          <Button variant="link" size="sm" className="px-2.5 py-2 text-[13px] no-underline" onClick={onLoginClick}>
            Log in
          </Button>
          <Button variant="primary" size="sm" className="rounded-[9px] px-4.5 py-2 text-[13px]" onClick={onSignupClick}>
            Start building
          </Button>
        </div>
      </div>
    </header>
  );
}
