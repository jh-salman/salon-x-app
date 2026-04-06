import type { Request, Response } from "express";
import { z } from "zod";
import { salonService } from "./services.salon.js";
import { HttpError } from "../../middleware/http-error.js";

const patchSchema = z.object({
  plan: z.enum(["FREE", "PRO"]),
});

const CAN_EDIT = new Set(["OWNER", "ADMIN"]);

export const salonSettingsController = {
  async patch(req: Request, res: Response) {
    const salonId = req.salonId;
    const role = req.salonRole;
    if (!salonId) {
      throw new HttpError(500, "INTERNAL", "Missing salon after middleware");
    }
    if (!role || !CAN_EDIT.has(role)) {
      throw new HttpError(403, "FORBIDDEN", "Only owners and admins can change salon plan");
    }

    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "VALIDATION_ERROR", parsed.error.message);
    }

    const row = await salonService.updatePlan(salonId, parsed.data.plan);
    res.json({ data: row });
  },
};
