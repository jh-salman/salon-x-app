import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { workspaceController } from "./controllers.workspace.js";

/** `/api/v1/workspace` — `SalonMemberWorkspace` (display name / info per member). */
export const workspaceRoutes = Router();

workspaceRoutes.get("/", asyncHandler(workspaceController.get));
workspaceRoutes.patch("/", asyncHandler(workspaceController.patch));
