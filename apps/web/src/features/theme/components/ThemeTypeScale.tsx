import { fontStack, type ThemeOption } from "@repo/contracts";
import type { TypeSpecimen } from "../lib/build-design-system";
import { ThemeSystemSection } from "./ThemeSystemSection";

export function ThemeTypeScale({
  specimens,
  fonts,
}: {
  specimens: readonly TypeSpecimen[];
  fonts: ThemeOption["fonts"];
}) {
  return (
    <ThemeSystemSection
      title="Typography"
      hint={`One family pairing — ${fonts.heading} for everything that shouts, ${fonts.body} for everything that explains.`}
    >
      <div className="flex flex-col gap-4">
        {specimens.map((specimen) => (
          <div key={specimen.id} className="border-b pb-3" style={{ borderColor: "color-mix(in srgb, currentColor 12%, transparent)" }}>
            <p
              className="leading-none"
              style={{
                fontFamily: fontStack(specimen.family === "heading" ? fonts.heading : fonts.body),
                fontSize: specimen.sizePx,
                fontWeight: specimen.weight,
              }}
            >
              {specimen.sample}
            </p>
            <p className="mt-2 text-[10px] opacity-60">
              {specimen.label} · {specimen.note}
            </p>
          </div>
        ))}
      </div>
    </ThemeSystemSection>
  );
}
