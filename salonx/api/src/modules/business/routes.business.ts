import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { businessController } from "./controllers.business.js";

/** `/api/v1/business` — `SalonBusinessProfile` (tenant). */
export const businessRoutes = Router();

businessRoutes.get("/", asyncHandler(businessController.get));
businessRoutes.patch("/", asyncHandler(businessController.patch));
