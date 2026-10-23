import type { DesignSystemView } from "../lib/build-design-system";
import { ThemeSystemSection } from "./ThemeSystemSection";

export function ThemeShapeSection({
  radius,
  elevation,
}: {
  radius: DesignSystemView["radius"];
  elevation: string;
}) {
  return (
    <>
      <ThemeSystemSection title="Radius" hint={radius.philosophy}>
        <div className="flex flex-wrap gap-3">
          {radius.steps.map((step) => (
            <div key={step.id} className="flex w-16 flex-col items-center gap-1">
              <div
                className="size-14 border-2"
                style={{
                  borderRadius: step.px >= 999 ? "999px" : `${step.px}px`,
                  borderColor: step.current ? "currentColor" : "color-mix(in srgb, currentColor 35%, transparent)",
                }}
              />
              <p className="text-center text-[10px] opacity-70">{step.label}</p>
            </div>
          ))}
        </div>
      </ThemeSystemSection>
      <ThemeSystemSection title="Elevation" hint={elevation} />
    </>
  );
}
