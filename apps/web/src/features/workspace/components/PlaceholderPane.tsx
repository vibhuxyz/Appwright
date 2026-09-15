import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { Badge } from "@/shared/components/ui/Badge";

// Database / Logs / Analytics / Settings are real tabs with no backing slice
// yet — say so plainly instead of shipping a fake screen.
export function PlaceholderPane({
  title,
  description,
  version,
}: {
  title: string;
  description: string;
  version: string;
}) {
  return (
    <Panel className="flex-1">
      <PanelHeader title={title} badge={<Badge>{version}</Badge>} />
      <div className="grid flex-1 place-items-center p-8">
        <p className="max-w-sm text-center text-[13px] text-muted">{description}</p>
      </div>
    </Panel>
  );
}
