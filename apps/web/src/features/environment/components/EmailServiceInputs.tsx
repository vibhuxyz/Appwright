import type { SelectableEmailProvider } from "@repo/contracts";
import { SmtpConfigInputs } from "./SmtpConfigInputs";

interface EmailServiceInputsProps {
  provider: SelectableEmailProvider;
  setProvider: (p: SelectableEmailProvider) => void;
  emailFrom: string;
  setEmailFrom: (val: string) => void;
  apiKey: string;
  setApiKey: (val: string) => void;
  smtpHost: string;
  setSmtpHost: (val: string) => void;
  smtpPort: string;
  setSmtpPort: (val: string) => void;
  smtpUser: string;
  setSmtpUser: (val: string) => void;
  smtpPass: string;
  setSmtpPass: (val: string) => void;
  smtpSecure: boolean;
  setSmtpSecure: (val: boolean) => void;
}

export function EmailServiceInputs({
  provider,
  setProvider,
  emailFrom,
  setEmailFrom,
  apiKey,
  setApiKey,
  smtpHost,
  setSmtpHost,
  smtpPort,
  setSmtpPort,
  smtpUser,
  setSmtpUser,
  smtpPass,
  setSmtpPass,
  smtpSecure,
  setSmtpSecure,
}: EmailServiceInputsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 border-t border-zinc-800/60 pt-3 md:grid-cols-3">
      <div>
        <label className="text-xs text-zinc-400">Active Provider</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as SelectableEmailProvider)}
          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
        >
          <option value="brevo">Brevo (Sendinblue)</option>
          <option value="nodemailer">Nodemailer (SMTP)</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-zinc-400">Sender Address (EMAIL_FROM)</label>
        <input
          type="email"
          value={emailFrom}
          onChange={(e) => setEmailFrom(e.target.value)}
          placeholder="noreply@app.com"
          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
        />
      </div>
      {provider !== "nodemailer" ? (
        <div>
          <label className="text-xs text-zinc-400">
            Brevo API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="••••••••••••••••"
            className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
          />
        </div>
      ) : (
        <SmtpConfigInputs
          smtpHost={smtpHost}
          setSmtpHost={setSmtpHost}
          smtpPort={smtpPort}
          setSmtpPort={setSmtpPort}
          smtpUser={smtpUser}
          setSmtpUser={setSmtpUser}
          smtpPass={smtpPass}
          setSmtpPass={setSmtpPass}
          smtpSecure={smtpSecure}
          setSmtpSecure={setSmtpSecure}
        />
      )}
    </div>
  );
}
