import { EnhancePromptRequest } from "@repo/contracts";
import { Router, type Response } from "express";
import {
  enhancePrompt,
  ENHANCE_TIMEOUT_MS,
  MAX_ENHANCE_INPUT_BYTES,
} from "../prompt-enhance";

export const promptRouter = Router();

function errorBody(res: Response, code: string, message: string) {
  return {
    error: {
      code,
      message,
      details: {},
      requestId: String(res.getHeader("x-request-id") ?? ""),
    },
  };
}

function abortWhenClientLeaves(res: Response): AbortSignal {
  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) controller.abort();
  });
  return controller.signal;
}

promptRouter.post("/prompt/enhance", async (req, res) => {
  const parsed = EnhancePromptRequest.safeParse(req.body);
  const prompt = parsed.success ? parsed.data.prompt.trim() : "";
  if (!prompt) {
    return res
      .status(400)
      .json(errorBody(res, "INVALID_REQUEST", "Prompt cannot be empty"));
  }
  if (Buffer.byteLength(prompt, "utf8") > MAX_ENHANCE_INPUT_BYTES) {
    return res
      .status(400)
      .json(
        errorBody(
          res,
          "PROMPT_TOO_LONG",
          "This prompt is too long to enhance. Shorten it and try again.",
        ),
      );
  }

  const clientSignal = abortWhenClientLeaves(res);
  const result = await enhancePrompt(
    prompt,
    AbortSignal.any([clientSignal, AbortSignal.timeout(ENHANCE_TIMEOUT_MS)]),
  );
  if (result.ok) return res.json({ enhancedPrompt: result.enhancedPrompt });
  if (clientSignal.aborted) return;
  if (result.reason === "aborted") {
    return res
      .status(503)
      .json(
        errorBody(
          res,
          "GENERATION_TIMEOUT",
          "Enhancing took too long. Try again.",
        ),
      );
  }
  return res
    .status(503)
    .json(
      errorBody(
        res,
        result.reason === "too_long" ? "OUTPUT_TOO_LARGE" : "GENERATION_FAILED",
        result.message,
      ),
    );
});
