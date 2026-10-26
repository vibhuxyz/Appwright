const DEFAULT_GATEWAY_URL = "http://localhost:3001";

export const INTEGRATION_GATEWAY_URL = (process.env.PUBLIC_API_URL ?? DEFAULT_GATEWAY_URL).replace(/\/+$/, "");
