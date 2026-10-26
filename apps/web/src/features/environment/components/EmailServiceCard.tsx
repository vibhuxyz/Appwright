import { useState } from "react";
import { Mail } from "lucide-react";
import type {
  SelectableEmailProvider,
  ProjectIntegrationResponse,
  IntegrationEnvironment,
} from "@repo/contracts";
import {
  useSaveAndTestIntegration,
  useSetEmailProvider,
} from "../hooks/useEnvironment";
import { EmailCardActions } from "./EmailCardActions";
import { EmailServiceInputs } from "./EmailServiceInputs";
import { SendTestEmailModal } from "./SendTestEmailModal";
import { IntegrationLogo } from "@/shared/components/integration-logo";

interface EmailServiceCardProps {
  projectId: string;
  integration: ProjectIntegrationResponse;
  selectedEnv: IntegrationEnvironment;
  isTesting: boolean;
  onTest: () => void;
}

const PROVIDER_NAMES: Record<SelectableEmailProvider, string> = {
  brevo: "Brevo (Sendinblue)",
  nodemailer: "Nodemailer (Custom SMTP)",
};

export function EmailServiceCard({
  projectId,
  integration,
  selectedEnv,
  isTesting,
  onTest,
}: EmailServiceCardProps) {
  const config = (integration.config as Record<string, unknown>) ?? {};
  const currentProvider: SelectableEmailProvider =
    config.activeProvider === "nodemailer" ? "nodemailer" : "brevo";
  const [provider, setProvider] = useState<SelectableEmailProvider>(currentProvider);
  const [showTestModal, setShowTestModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);

  const setProviderMutation = useSetEmailProvider(projectId);
  const saveAndTest = useSaveAndTestIntegration(projectId);

  const handleSave = async () => {
    await setProviderMutation.mutateAsync({ environment: selectedEnv, provider });
    const vars: Record<string, string> = {};
    if (emailFrom) vars.EMAIL_FROM = emailFrom;
    if (provider === "brevo" && apiKey) vars.BREVO_API_KEY = apiKey;
    if (provider === "nodemailer") {
      if (smtpHost) vars.SMTP_HOST = smtpHost;
      if (smtpPort) vars.SMTP_PORT = smtpPort;
      if (smtpUser) vars.SMTP_USER = smtpUser;
      if (smtpPass) vars.SMTP_PASSWORD = smtpPass;
      vars.SMTP_SECURE = smtpSecure ? "true" : "false";
    }

    if (Object.keys(vars).length > 0) {
      await saveAndTest.mutateAsync({
        provider: "email",
        environment: selectedEnv,
        emailProvider: provider,
        variables: vars,
      });
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-surface-2 p-4 md:col-span-2 lg:col-span-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-zinc-800/80 p-2 text-zinc-300">
              {provider === "brevo" ? <IntegrationLogo provider="email" className="size-5" /> : <Mail className="size-4 text-emerald-400" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Email Delivery</h3>
              <p className="text-xs text-muted">Active: {PROVIDER_NAMES[provider]}</p>
            </div>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
            {integration.status}
          </span>
        </div>

        <EmailServiceInputs
          provider={provider}
          setProvider={setProvider}
          emailFrom={emailFrom}
          setEmailFrom={setEmailFrom}
          apiKey={apiKey}
          setApiKey={setApiKey}
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
      </div>

      <EmailCardActions
        lastTestedAt={integration.lastTestedAt}
        isSaving={saveAndTest.isPending}
        isTesting={isTesting}
        onSave={handleSave}
        onTest={onTest}
        onOpenTestModal={() => setShowTestModal(true)}
      />

      {showTestModal && (
        <SendTestEmailModal
          projectId={projectId}
          environment={selectedEnv}
          onClose={() => setShowTestModal(false)}
        />
      )}
    </div>
  );
}
