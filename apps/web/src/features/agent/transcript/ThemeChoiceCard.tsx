import type { ThemeOption } from "@repo/contracts";
import { useThemeFonts } from "@/features/theme";

const SWATCHES = ["background", "primary", "accent", "foreground"] as const;

export function ThemeChoiceCard({ theme }: { theme: ThemeOption }) {
  useThemeFonts([theme]);
  return (
    <div className="w-full max-w-[88%] self-end overflow-hidden rounded-2xl rounded-tr-xs border border-info/20 bg-info/10 text-[13px] sm:max-w-[80%]">
      <p className="px-4 pt-3 text-foreground-secondary">Design — Pick a design system</p>
      <div className="px-4 pt-1 pb-3">
        <p className="font-semibold text-foreground">{theme.name} <span className="font-normal text-muted">({theme.mood})</span></p>
        <p className="mt-0.5 text-xs text-muted">{theme.tagline}</p>
        <ul aria-label="Colours" className="mt-2.5 flex gap-1.5">
          {SWATCHES.map((token) => (
            <li key={token} className="flex flex-col items-center gap-1">
              <span aria-hidden="true" className="size-7 rounded-lg border border-border" style={{ backgroundColor: theme.palette[token] }} />
              <span className="text-[10px] text-muted capitalize">{token}</span>
            </li>
          ))}
        </ul>
        <div
          className="mt-3 rounded-xl border border-border-soft p-3"
          style={{ backgroundColor: theme.palette.background, color: theme.palette.foreground, fontFamily: `"${theme.fonts.body}", sans-serif` }}
        >
          <p className="text-base leading-tight font-bold" style={{ fontFamily: `"${theme.fonts.heading}", sans-serif` }}>Your heading looks like this</p>
          <p className="mt-1 text-xs opacity-80">Body text uses {theme.fonts.body}. Headings use {theme.fonts.heading}.</p>
          <span className="mt-2 inline-block rounded-md px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: theme.palette.primary, color: theme.palette.primaryForeground }}>Button</span>
        </div>
      </div>
    </div>
  );
}
