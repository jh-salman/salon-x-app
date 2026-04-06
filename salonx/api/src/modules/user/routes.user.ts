import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { userController } from "./controllers.user.js";

/** `/api/v1/me` — auth only (no `x-salon-id`). */
export const userRoutes = Router();

userRoutes.get("/salons", asyncHandler(userController.listSalons));
