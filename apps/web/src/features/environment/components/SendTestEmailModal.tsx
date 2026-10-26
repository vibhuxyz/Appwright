import { useState } from "react";
import { Check, Loader2, Send, X } from "lucide-react";
import type { SendTestEmailResponse } from "@repo/contracts";
import { useSendTestEmail } from "../hooks/useEnvironment";
import { IntegrationLogo } from "@/shared/components/integration-logo";

interface SendTestEmailModalProps {
  projectId: string;
  environment: "development" | "preview" | "production";
  onClose: () => void;
}

export function SendTestEmailModal({
  projectId,
  environment,
  onClose,
}: SendTestEmailModalProps) {
  const [to, setTo] = useState("");
  const [result, setResult] = useState<SendTestEmailResponse | null>(null);
  const sendEmail = useSendTestEmail(projectId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) return;

    try {
      const res = await sendEmail.mutateAsync({
        environment,
        to: to.trim(),
        subject: `Appwright Test Email [${environment}]`,
      });
      setResult(res);
    } catch (err) {
      setResult({
        ok: false,
        provider: "email",
        message: err instanceof Error ? err.message : "Failed to send test email",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <IntegrationLogo provider="email" className="size-5" />
            <h3 className="text-sm font-semibold text-white">Send Test Email</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-300">Recipient Email</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="developer@example.com"
              required
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {result && (
            <div
              className={`rounded-lg border p-3 text-xs ${
                result.ok
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium">
                {result.ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                <span>{result.message}</span>
              </div>
              {result.messageId && (
                <p className="mt-1 font-mono text-[10px] text-zinc-400">
                  Message ID: {result.messageId}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={sendEmail.isPending || !to.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {sendEmail.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              <span>Send Email</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
