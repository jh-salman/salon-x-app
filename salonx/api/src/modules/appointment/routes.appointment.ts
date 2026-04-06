import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { appointmentController } from "./controllers.appointment.js";

export const appointmentRoutes = Router();

appointmentRoutes.get("/", asyncHandler(appointmentController.list));
