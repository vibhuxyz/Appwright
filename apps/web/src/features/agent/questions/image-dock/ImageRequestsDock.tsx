import { imageSectionLabel, imageSectionQuestion, type AssetRequestResponse } from "@repo/contracts";
import { AssetSlotResolver } from "@/features/assets";
import { DockFooter, DockFrame } from "../components";
import { useImageDock } from "./use-image-dock";

interface ImageRequestsDockProps {
  sessionId: string;
  projectId: string;
  requests: readonly AssetRequestResponse[];
  onCollapse: () => void;
}

export function ImageRequestsDock({ sessionId, projectId, requests, onCollapse }: ImageRequestsDockProps) {
  const dock = useImageDock({ sessionId, projectId, requests });
  const step = dock.currentStep;
  return (
    <DockFrame
      onMinimize={onCollapse}
      footer={step && (
        <DockFooter
          stepIndex={dock.stepIndex}
          stepCount={dock.steps.length}
          isLastStep={dock.isLastStep}
          canAutoAnswer={dock.canAutoAnswer}
          isSubmitting={false}
          onBack={dock.actions.back}
          onForward={dock.actions.forward}
          onAutoAnswer={dock.actions.autoAnswer}
          onNext={dock.actions.next}
        />
      )}
    >
      {step ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-[15px] leading-snug font-medium text-foreground">
              {imageSectionLabel(step.slot)} — {imageSectionQuestion(step.slot)}
            </h3>
            <p className="mt-1 text-xs text-muted">Upload a PNG or JPEG up to 5 MB, search photos, or generate one.</p>
          </div>
          <AssetSlotResolver key={step.id} assetRequestId={step.assetRequestId} slot={step.slot} resolver={dock.resolver} />
        </div>
      ) : (
        <p role="status" className="text-sm text-muted">Preparing image choices…</p>
      )}
      {dock.error && <p role="alert" className="text-xs text-danger">{dock.error}</p>}
    </DockFrame>
  );
}
