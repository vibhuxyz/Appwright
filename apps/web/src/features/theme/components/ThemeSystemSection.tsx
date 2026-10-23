import type { ReactNode } from "react";

export function ThemeSystemSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <section className="mt-7">
      <h3 className="text-[13px] font-semibold tracking-tight">{title}</h3>
      {hint ? <p className="mt-1 max-w-prose text-[11px] leading-relaxed opacity-70">{hint}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}
