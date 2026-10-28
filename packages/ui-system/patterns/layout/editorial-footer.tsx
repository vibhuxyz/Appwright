const MAX_FOOTER_COLUMNS = 4;

export interface FooterColumn {
  title: string;
  links: readonly { label: string; href: string }[];
}

export interface EditorialFooterProps {
  brand: string;
  statement: string;
  columns: readonly FooterColumn[];
  legal: string;
}

export function EditorialFooter({
  brand,
  statement,
  columns,
  legal,
}: EditorialFooterProps) {
  return (
    <footer
      data-section="footer.editorial"
      className="overflow-hidden bg-foreground text-background"
    >
      <div className="mx-auto max-w-screen-2xl px-4 pt-20 md:px-8">
        <div className="grid gap-12 md:grid-cols-12">
          <p className="font-heading text-2xl leading-snug text-balance md:col-span-5 md:text-3xl">
            {statement}
          </p>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-6 md:col-start-7">
            {columns.slice(0, MAX_FOOTER_COLUMNS).map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <p className="text-xs uppercase tracking-widest opacity-60">
                  {column.title}
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <p className="mt-16 flex justify-between border-t border-background/20 py-6 text-xs uppercase tracking-widest opacity-60">
          <span>{legal}</span>
        </p>
        <p
          aria-hidden="true"
          className="-mb-4 font-heading text-7xl md:-mb-8 md:text-9xl leading-none font-bold tracking-tighter whitespace-nowrap"
        >
          {brand}
        </p>
      </div>
    </footer>
  );
}
