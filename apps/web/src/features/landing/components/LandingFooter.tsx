const FOOTER_LINKS = [
  { label: "Templates", href: "#templates" },
  { label: "Platform", href: "#platform" },
  { label: "Pricing", href: "#pricing" },
  { label: "Changelog", href: "#how" },
  { label: "Docs", href: "#top" },
  { label: "Status", href: "#top" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border-soft px-6 py-10">
      <div className="mx-auto flex max-w-350 flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-[7px] bg-lime text-sm font-black text-background-deep">
            A
          </span>
          <span className="font-bold tracking-tight">appwright</span>
          <span className="ml-2.5 text-[13px] text-muted">© 2026</span>
        </div>
        <div className="flex flex-wrap gap-4.5 text-[13.5px] text-foreground-secondary">
          {FOOTER_LINKS.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
