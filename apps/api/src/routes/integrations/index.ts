import { Router } from "express";
import { integrationCatalogRouter } from "./catalog";
import { integrationConfigurationRouter } from "./configure";
import { integrationDisconnectRouter } from "./disconnect";

export const integrationManagementRouter = Router();
integrationManagementRouter.use(integrationCatalogRouter);
integrationManagementRouter.use(integrationConfigurationRouter);
integrationManagementRouter.use(integrationDisconnectRouter);
export { awaitRequiredIntegrations } from "./await-required-integrations";
export { integrationError } from "./error-response";
