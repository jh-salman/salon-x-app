import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { healthController } from "./controllers.health.js";

export const healthRoutes = Router();

healthRoutes.get("/", healthController.live);
healthRoutes.get("/live", healthController.live);
healthRoutes.get("/ready", asyncHandler(healthController.ready));
