import type { DesignColorToken } from "../lib/build-design-system";
import { ThemeSystemSection } from "./ThemeSystemSection";

function Swatch({ token }: { token: DesignColorToken }) {
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "color-mix(in srgb, currentColor 12%, transparent)" }}>
      <div className="h-14 px-2 py-1.5 text-[10px] font-medium" style={{ backgroundColor: token.hex, color: token.onHex }}>
        {token.token}
      </div>
      <div className="px-2 py-1.5 text-[10px] leading-snug">
        <p className="font-medium">{token.hex.toUpperCase()}</p>
        <p className="opacity-70">{token.usage}</p>
      </div>
    </div>
  );
}

export function ThemeColorSwatches({ colors }: { colors: readonly DesignColorToken[] }) {
  const grounds = colors.filter((token) => token.group === "grounds" || token.group === "semantic");
  const surfaces = colors.filter((token) => token.group === "surfaces");
  return (
    <>
      <ThemeSystemSection
        title="Colors"
        hint="Each screen owns one hue as its ground. Text colour on a hue is decided by contrast, not taste."
      >
        <p className="mb-2 text-[11px] font-medium opacity-70">Grounds and accents</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {grounds.map((token) => (
            <Swatch key={token.token} token={token} />
          ))}
        </div>
      </ThemeSystemSection>
      <ThemeSystemSection title="Surfaces and text">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {surfaces.map((token) => (
            <Swatch key={token.token} token={token} />
          ))}
        </div>
      </ThemeSystemSection>
    </>
  );
}
