import { Router } from "express";
import { agentQuestionRouter } from "./agent-questions";
import { integrationRequestRouter } from "./integration-requests";

export const interactionsRouter = Router();
interactionsRouter.use(agentQuestionRouter);
interactionsRouter.use(integrationRequestRouter);
