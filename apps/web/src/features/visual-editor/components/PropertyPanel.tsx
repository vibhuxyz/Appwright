import { SlidersHorizontal } from "lucide-react";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { PROPERTY_GROUPS } from "../lib/properties";
import { changesFor } from "../lib/pending";
import { useDesignState } from "../store/design-state";
import type { FrameSelection } from "../schemas/editor-schemas";
import { BreakpointSwitcher } from "./BreakpointSwitcher";
import { IntentBox } from "./IntentBox";
import { PropertyField } from "./PropertyField";

export function PropertyPanel({ selection }: { selection: FrameSelection | null }) {
  const selectedId = useDesignState((s) => s.selectedId);
  const breakpoint = useDesignState((s) => s.breakpoint);
  const changes = useDesignState((s) => s.history.present);
  const setChange = useDesignState((s) => s.setChange);
  const revertChange = useDesignState((s) => s.revertChange);
  const pending = selectedId ? changesFor(changes, selectedId) : new Map();
  const computed = selection?.awId === selectedId ? selection.computed : null;

  return (
    <Panel className="w-80 shrink-0">
      <PanelHeader
        icon={<SlidersHorizontal className="size-4 text-muted" aria-hidden />}
        title={selectedId ?? "Properties"}
        actions={<BreakpointSwitcher />}
      />
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {!selectedId && <p className="p-4 text-sm text-muted">Click an element in the preview to edit it.</p>}
        {selectedId && !computed && (
          <p className="p-4 text-sm text-muted">Click this element in the preview to read its current values.</p>
        )}
        {selectedId &&
          computed &&
          PROPERTY_GROUPS.map((group) => (
            <fieldset key={group.id} className="pb-2">
              <legend className="px-4 py-1 text-[11px] font-semibold text-muted uppercase">{group.label}</legend>
              {group.properties.map((property) => {
                const change = pending.get(`${property}:${breakpoint}`);
                return (
                  <PropertyField
                    key={`${selectedId}:${breakpoint}:${property}`}
                    property={property}
                    currentValue={change?.to ?? computed[property] ?? ""}
                    isChanged={change !== undefined}
                    onCommit={(to) =>
                      setChange({ componentId: selectedId, property, from: computed[property] ?? "", to, breakpoint })
                    }
                    onRevert={() => revertChange({ componentId: selectedId, property })}
                  />
                );
              })}
            </fieldset>
          ))}
        {selectedId && <IntentBox componentId={selectedId} />}
      </div>
    </Panel>
  );
}
