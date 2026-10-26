import { useState } from "react";
import { Lock } from "lucide-react";
import type { VariableScope } from "@repo/contracts";

interface AddVariableFormProps {
  selectedEnv: "development" | "preview" | "production";
  onSave: (input: {
    environment: VariableScope;
    key: string;
    value: string;
    isSecret: boolean;
  }) => void;
  onCancel: () => void;
}

export function AddVariableForm({
  selectedEnv,
  onSave,
  onCancel,
}: AddVariableFormProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isSecret, setIsSecret] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    onSave({
      environment: selectedEnv,
      key: newKey.trim(),
      value: newValue.trim(),
      isSecret,
    });
    setNewKey("");
    setNewValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border/80 bg-[#121622] p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-[11px] font-semibold text-muted">Variable Key</label>
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="e.g. AUTH_SECRET"
            className="mt-1 w-full rounded-xl border border-border/70 bg-surface/60 px-3 py-2 text-xs text-white placeholder-muted focus:border-lime focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted">Value</label>
          <input
            type={isSecret ? "password" : "text"}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Enter value"
            className="mt-1 w-full rounded-xl border border-border/70 bg-surface/60 px-3 py-2 text-xs text-white placeholder-muted focus:border-lime focus:outline-none"
          />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-muted">
          <input
            type="checkbox"
            checked={isSecret}
            onChange={(e) => setIsSecret(e.target.checked)}
            className="rounded border-border bg-surface text-lime focus:ring-lime"
          />
          <Lock className="size-3 text-muted" />
          <span>Encrypt value as secure secret</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1 text-xs text-muted hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-lime px-3.5 py-1 text-xs font-semibold text-black hover:bg-lime/90"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
}
