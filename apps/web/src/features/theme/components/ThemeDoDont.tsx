import { ThemeSystemSection } from "./ThemeSystemSection";

export function ThemeDoDont({ dos, donts }: { dos: readonly string[]; donts: readonly string[] }) {
  return (
    <ThemeSystemSection title="Do's and Don'ts">
      <div className="grid gap-4 sm:grid-cols-2">
        <ul className="flex flex-col gap-2">
          {dos.map((rule) => (
            <li key={rule} className="flex gap-2 text-[11px] leading-snug">
              <span aria-hidden className="mt-0.5 size-4 shrink-0 rounded-full text-center text-[10px] leading-4 font-bold" style={{ backgroundColor: "color-mix(in srgb, currentColor 14%, transparent)" }}>
                ✓
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-2">
          {donts.map((rule) => (
            <li key={rule} className="flex gap-2 text-[11px] leading-snug">
              <span aria-hidden className="mt-0.5 size-4 shrink-0 rounded-full text-center text-[10px] leading-4 font-bold" style={{ backgroundColor: "color-mix(in srgb, currentColor 14%, transparent)" }}>
                ✕
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </ThemeSystemSection>
  );
}
