interface SmtpConfigInputsProps {
  smtpHost: string;
  setSmtpHost: (v: string) => void;
  smtpPort: string;
  setSmtpPort: (v: string) => void;
  smtpUser: string;
  setSmtpUser: (v: string) => void;
  smtpPass: string;
  setSmtpPass: (v: string) => void;
  smtpSecure: boolean;
  setSmtpSecure: (v: boolean) => void;
}

export function SmtpConfigInputs({
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
}: SmtpConfigInputsProps) {
  return (
    <>
      <div>
        <label className="text-xs text-zinc-400">SMTP Host & Port</label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            placeholder="smtp.mail.com"
            className="w-2/3 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
          />
          <input
            type="text"
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
            placeholder="587"
            className="w-1/3 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-zinc-400">SMTP User</label>
        <input
          type="text"
          value={smtpUser}
          onChange={(e) => setSmtpUser(e.target.value)}
          placeholder="user@mail.com"
          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
        />
      </div>
      <div>
        <label className="text-xs text-zinc-400">SMTP Password</label>
        <input
          type="password"
          value={smtpPass}
          onChange={(e) => setSmtpPass(e.target.value)}
          placeholder="••••••••"
          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
        />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="smtp-secure"
          checked={smtpSecure}
          onChange={(e) => setSmtpSecure(e.target.checked)}
          className="rounded border-zinc-700 bg-zinc-900"
        />
        <label htmlFor="smtp-secure" className="text-xs text-zinc-300">
          TLS/SSL (Secure)
        </label>
      </div>
    </>
  );
}
