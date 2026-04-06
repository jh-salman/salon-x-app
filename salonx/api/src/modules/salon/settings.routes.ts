import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { salonSettingsController } from "./controllers.salon-settings.js";

/** `PATCH /api/v1/salon` — tenant settings (requires `x-salon-id`). */
export const salonSettingsRoutes = Router();

salonSettingsRoutes.patch("/", asyncHandler(salonSettingsController.patch));
