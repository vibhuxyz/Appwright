import { useRef, useState } from "react";
import { useFrameSelection } from "../hooks/use-frame-selection";
import type { CompileResult, SubmitResult } from "../schemas/editor-schemas";
import { CanvasFrame } from "./CanvasFrame";
import { ChangeSetReport } from "./ChangeSetReport";
import { LayerPanel } from "./LayerPanel";
import { PendingBar } from "./PendingBar";
import { PropertyPanel } from "./PropertyPanel";

interface VisualEditorProps {
  projectId: string;
  previewUrl: string | null;
}

export default function VisualEditor({ projectId, previewUrl }: VisualEditorProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const selection = useFrameSelection(frameRef, previewUrl ?? "");
  const [compiled, setCompiled] = useState<CompileResult | null>(null);
  const [submitted, setSubmitted] = useState<SubmitResult | null>(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PendingBar
        projectId={projectId}
        onCompiled={(result) => {
          setCompiled(result);
          setSubmitted(null);
        }}
        onSubmitted={(result) => {
          setSubmitted(result);
          setCompiled(null);
        }}
      />
      <ChangeSetReport compiled={compiled} submitted={submitted} />
      <div className="flex min-h-0 flex-1 gap-3 p-3">
        <LayerPanel projectId={projectId} />
        <CanvasFrame frameRef={frameRef} previewUrl={previewUrl} />
        <PropertyPanel selection={selection} />
      </div>
    </div>
  );
}
