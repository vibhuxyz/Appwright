import { resolveProjectRuntimeEnvVars } from "../lib/environment-registry";
import { getEmailProvider } from "./provider-factory";
import { getActiveEmailProvider } from "./provider-selection";
import type { SendEmailInput, SendEmailResult } from "./types";

interface SendProjectEmailInput extends SendEmailInput {
  projectId: string;
  environment?: "development" | "preview" | "production";
}

export async function sendProjectEmail(
  input: SendProjectEmailInput,
): Promise<SendEmailResult> {
  const { projectId, environment = "development", ...emailPayload } = input;

  const activeProvider = await getActiveEmailProvider(projectId, environment);
  const envVars = await resolveProjectRuntimeEnvVars({
    projectId,
    environment,
  });

  const provider = getEmailProvider(activeProvider);
  return provider.sendEmail(emailPayload, envVars);
}
