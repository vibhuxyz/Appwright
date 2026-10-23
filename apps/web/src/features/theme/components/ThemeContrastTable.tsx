import type { ContrastRow } from "../lib/build-design-system";
import { ThemeSystemSection } from "./ThemeSystemSection";

export function ThemeContrastTable({ rows }: { rows: readonly ContrastRow[] }) {
  return (
    <ThemeSystemSection title="Contrast (WCAG AA)" hint="Body text needs 4.5:1. Display type at 24px bold may use 3:1.">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b opacity-70" style={{ borderColor: "currentColor" }}>
              <th className="py-1.5 pr-2 font-medium">Pair</th>
              <th className="py-1.5 pr-2 font-medium">Ratio</th>
              <th className="py-1.5 font-medium">Use</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.pair} className="border-b" style={{ borderColor: "color-mix(in srgb, currentColor 14%, transparent)" }}>
                <td className="py-1.5 pr-2">{row.pair}</td>
                <td className="py-1.5 pr-2 tabular-nums">{row.ratio}</td>
                <td className="py-1.5">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: row.badge, color: row.ink }}
                  >
                    {row.use}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ThemeSystemSection>
  );
}
