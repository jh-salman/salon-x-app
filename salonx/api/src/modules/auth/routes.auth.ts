import { Router } from "express";
import { authController } from "./controllers.auth.js";

export const authModeRoutes = Router();

authModeRoutes.get("/mode", authController.mode);
authModeRoutes.post("/signup", authController.signup);
