import { AGENT_TOOL_RESULT_MARKERS } from "@repo/contracts";
import type { IntegrationRequestOutcome } from "@repo/db";

const GATEWAY_ROUTES: Readonly<Record<string, string>> = {
  razorpay: "POST /v1/integrations/razorpay/orders and POST /v1/integrations/razorpay/verify",
  email: "POST /v1/integrations/email/send",
  cloudinary: "POST /v1/integrations/cloudinary/upload",
};

const GATEWAY_RULE =
  "Call it only from server code using APPWRITE_API_URL with an Authorization: Bearer APPWRITE_INTEGRATION_TOKEN header. " +
  "Never put provider secrets or the gateway token in client code or chat.";

function modeLabel(credentialMode: string | undefined): string {
  return credentialMode === "APPWRITE_MANAGED" ? "the Appwright test key" : "the user's own key";
}

export function describeConnection(outcome: IntegrationRequestOutcome): string {
  if (outcome.status !== "CONNECTED") {
    return `${outcome.provider} was not connected (${outcome.status.toLowerCase()}). Build the feature against the gateway anyway, keep it disabled with a clear message, and tell the user to connect ${outcome.provider} from Connectors.`;
  }
  if (outcome.provider === "mongodb") {
    return `The database ${AGENT_TOOL_RESULT_MARKERS.integrationConnected} using ${outcome.credentialMode === "APPWRITE_MANAGED" ? "the Appwright database" : "the user's own MongoDB URI"}. Read it from process.env.MONGODB_URI on the server.`;
  }
  const route = GATEWAY_ROUTES[outcome.provider];
  const gateway = route ? ` Use the Appwright gateway at ${route}. ${GATEWAY_RULE}` : "";
  return `${outcome.provider} ${AGENT_TOOL_RESULT_MARKERS.integrationConnected} using ${modeLabel(outcome.credentialMode)}.${gateway}`;
}
