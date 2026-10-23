import type { ThemeOption } from "@repo/contracts";
import { cornerRadius } from "../lib/build-design-system";
import { ThemeSystemSection } from "./ThemeSystemSection";

function Chip({
  label,
  fill,
  ink,
  radius,
}: {
  label: string;
  fill: string;
  ink: string;
  radius: string;
}) {
  return (
    <span className="inline-flex items-center px-3 py-1 text-[11px] font-medium" style={{ backgroundColor: fill, color: ink, borderRadius: radius }}>
      {label}
    </span>
  );
}

export function ThemeLiveComponents({ theme }: { theme: ThemeOption }) {
  const { palette } = theme;
  const pill = cornerRadius(theme, "pill");
  const card = cornerRadius(theme, "card");
  const control = cornerRadius(theme, "control");
  return (
    <ThemeSystemSection
      title="Components"
      hint="Every control below is rendered live from this system's tokens, on the grounds it is used on."
    >
      <div className="flex flex-col gap-3">
        <div className="p-3" style={{ backgroundColor: palette.primary, color: palette.primaryForeground, borderRadius: card }}>
          <p className="mb-2 text-[10px] opacity-80">Buttons</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-4 py-2 text-[12px] font-semibold" style={{ backgroundColor: palette.accent, color: palette.accentForeground, borderRadius: pill }}>
              Primary action
            </span>
            <span className="px-4 py-2 text-[12px] font-semibold opacity-80" style={{ backgroundColor: palette.accent, color: palette.accentForeground, borderRadius: pill }}>
              Pressed
            </span>
            <span className="px-4 py-2 text-[12px] font-semibold" style={{ backgroundColor: palette.foreground, color: palette.background, borderRadius: pill }}>
              Inverse
            </span>
          </div>
        </div>
        <div className="p-3" style={{ backgroundColor: palette.secondary, color: palette.secondaryForeground, borderRadius: card }}>
          <p className="mb-2 text-[10px] opacity-80">Chips</p>
          <div className="flex flex-wrap gap-2">
            <Chip label={theme.name} fill={palette.card} ink={palette.foreground} radius={pill} />
            <Chip label={theme.style ?? "Brand"} fill={palette.primary} ink={palette.primaryForeground} radius={pill} />
            <Chip label={theme.density ?? "comfortable"} fill={palette.muted} ink={palette.mutedForeground} radius={pill} />
          </div>
        </div>
        <div className="p-3" style={{ backgroundColor: palette.accent, color: palette.accentForeground, borderRadius: card }}>
          <p className="mb-2 text-[10px] opacity-80">Cards</p>
          <div className="flex flex-wrap gap-2">
            <div className="min-w-28 flex-1 p-3" style={{ backgroundColor: palette.card, color: palette.foreground, borderRadius: control }}>
              <p className="text-[22px] leading-none font-bold">92</p>
              <p className="mt-1 text-[10px] opacity-70">Hero number</p>
            </div>
            <div className="min-w-28 flex-1 p-3" style={{ backgroundColor: palette.primary, color: palette.primaryForeground, borderRadius: control }}>
              <p className="text-[22px] leading-none font-bold">61</p>
              <p className="mt-1 text-[10px] opacity-80">On primary</p>
            </div>
            <div className="min-w-28 flex-1 p-3" style={{ backgroundColor: palette.foreground, color: palette.background, borderRadius: control }}>
              <p className="text-[10px] opacity-70">Inverse</p>
              <p className="text-[16px] leading-none font-bold">{theme.name}</p>
            </div>
          </div>
        </div>
        <div className="p-3" style={{ backgroundColor: palette.muted, color: palette.mutedForeground, borderRadius: card }}>
          <p className="mb-2 text-[10px] opacity-80">Progress · filled = ink, unfilled = 35%</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((index) => (
              <span
                key={index}
                className="h-1.5 flex-1"
                style={{
                  backgroundColor: index <= 2 ? palette.foreground : "color-mix(in srgb, currentColor 35%, transparent)",
                  borderRadius: 4,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </ThemeSystemSection>
  );
}
