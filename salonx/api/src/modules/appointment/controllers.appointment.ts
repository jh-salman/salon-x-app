import type { Request, Response } from "express";
import { z } from "zod";
import { appointmentService } from "./services.appointment.js";
import { HttpError } from "../../middleware/http-error.js";

const listQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  take: z.coerce.number().int().min(1).max(500).optional(),
});

export const appointmentController = {
  async list(req: Request, res: Response) {
    const salonId = req.salonId;
    if (!salonId) {
      throw new HttpError(500, "INTERNAL", "salonId missing after middleware");
    }

    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new HttpError(400, "VALIDATION_ERROR", parsed.error.message);
    }

    const { from, to, take } = parsed.data;
    const rows = await appointmentService.listForSalon(salonId, {
      from,
      to,
      take,
    });

    res.json({ data: rows });
  },
};
