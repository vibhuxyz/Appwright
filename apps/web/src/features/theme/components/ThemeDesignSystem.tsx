import { fontStack, type ThemeOption } from "@repo/contracts";
import { buildDesignSystem } from "../lib/build-design-system";
import { ThemeColorSwatches } from "./ThemeColorSwatches";
import { ThemeContrastTable } from "./ThemeContrastTable";
import { ThemeDoDont } from "./ThemeDoDont";
import { ThemeLiveComponents } from "./ThemeLiveComponents";
import { ThemeShapeSection } from "./ThemeShapeSection";
import { ThemeTypeScale } from "./ThemeTypeScale";

export function ThemeDesignSystem({ theme }: { theme: ThemeOption }) {
  const system = buildDesignSystem(theme);
  const { palette, fonts } = theme;
  return (
    <div
      className="px-4 py-5 text-left"
      style={{
        backgroundColor: palette.background,
        color: palette.foreground,
        fontFamily: fontStack(fonts.body),
      }}
    >
      <header className="border-b pb-4" style={{ borderColor: palette.border }}>
        <h2 className="text-2xl leading-tight font-bold" style={{ fontFamily: fontStack(fonts.heading) }}>
          {theme.name}
        </h2>
        <p className="mt-2 text-[12px] leading-relaxed opacity-80">{system.summary}</p>
        <p className="mt-2 text-[10px] opacity-60">
          {theme.mood} · {theme.density ?? "comfortable"} · {fonts.heading} / {fonts.body}
          {theme.style ? ` · ${theme.style}` : ""}
        </p>
      </header>
      <ThemeColorSwatches colors={system.colors} />
      <ThemeContrastTable rows={system.contrast} />
      <ThemeTypeScale specimens={system.type} fonts={fonts} />
      <ThemeShapeSection radius={system.radius} elevation={system.elevation} />
      <ThemeLiveComponents theme={theme} />
      <ThemeDoDont dos={system.dos} donts={system.donts} />
    </div>
  );
}
