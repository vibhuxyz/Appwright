export interface PromoBarProps {
  message: string;
  href?: string;
}

export function PromoBar({ message, href }: PromoBarProps) {
  const text = (
    <span className="text-xs font-semibold uppercase tracking-widest">
      {message}
    </span>
  );
  return (
    <div
      data-section="promo.bar"
      className="bg-primary px-4 py-1.5 text-center text-primary-foreground"
    >
      {href ? (
        <a
          href={href}
          className="inline-flex min-h-6 items-center underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
        >
          {text}
        </a>
      ) : (
        text
      )}
    </div>
  );
}
