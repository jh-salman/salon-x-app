import type { Request, Response } from "express";
import { z } from "zod";
import { businessService } from "./services.business.js";
import { HttpError } from "../../middleware/http-error.js";

const optionalStr = z.union([z.string(), z.null()]).optional();

const patchSchema = z.object({
  legalName: optionalStr,
  taxId: optionalStr,
  phone: optionalStr,
  email: optionalStr,
  websiteUrl: optionalStr,
  addressLine1: optionalStr,
  addressLine2: optionalStr,
  city: optionalStr,
  region: optionalStr,
  postalCode: optionalStr,
  country: optionalStr,
});

const CAN_EDIT_BUSINESS = new Set(["OWNER", "ADMIN"]);

export const businessController = {
  async get(req: Request, res: Response) {
    const salonId = req.salonId;
    if (!salonId) {
      throw new HttpError(500, "INTERNAL", "Missing salon after middleware");
    }

    const row = await businessService.getForSalon(salonId);
    res.json({ data: row });
  },

  async patch(req: Request, res: Response) {
    const salonId = req.salonId;
    const role = req.salonRole;
    if (!salonId) {
      throw new HttpError(500, "INTERNAL", "Missing salon after middleware");
    }
    if (!role || !CAN_EDIT_BUSINESS.has(role)) {
      throw new HttpError(403, "FORBIDDEN", "Only owners and admins can edit business details");
    }

    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "VALIDATION_ERROR", parsed.error.message);
    }

    const row = await businessService.upsertForSalon(salonId, parsed.data);
    res.json({ data: row });
  },
};
