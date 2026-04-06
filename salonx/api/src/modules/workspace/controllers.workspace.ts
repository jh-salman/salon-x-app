import type { Request, Response } from "express";
import { z } from "zod";
import { workspaceService } from "./services.workspace.js";
import { HttpError } from "../../middleware/http-error.js";

const patchSchema = z.object({
  displayNameOverride: z.union([z.string(), z.null()]).optional(),
  info: z.union([z.string(), z.null()]).optional(),
});

export const workspaceController = {
  async get(req: Request, res: Response) {
    const salonId = req.salonId;
    const userId = req.auth?.user.id;
    if (!salonId || !userId) {
      throw new HttpError(500, "INTERNAL", "Missing salon or user after middleware");
    }

    const row = await workspaceService.getForMember(salonId, userId);
    res.json({ data: row });
  },

  async patch(req: Request, res: Response) {
    const salonId = req.salonId;
    const userId = req.auth?.user.id;
    if (!salonId || !userId) {
      throw new HttpError(500, "INTERNAL", "Missing salon or user after middleware");
    }

    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "VALIDATION_ERROR", parsed.error.message);
    }

    const row = await workspaceService.upsertForMember(salonId, userId, parsed.data);
    res.json({ data: row });
  },
};
