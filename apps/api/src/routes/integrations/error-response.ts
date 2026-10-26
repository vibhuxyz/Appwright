import type { Response } from "express";

export function integrationError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details: Record<string, unknown> = {},
) {
  const requestId = res.getHeader("x-request-id");
  return res.status(status).json({
    error: {
      code,
      message,
      details,
      requestId: typeof requestId === "string" ? requestId : "",
    },
  });
}
