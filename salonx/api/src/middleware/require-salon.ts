import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "./http-error.js";
import { asyncHandler } from "./async-handler.js";

const SALON_HEADER = "x-salon-id";

export const requireSalonMembership: RequestHandler = asyncHandler(async (req, _res, next) => {
  const salonId = (req.get(SALON_HEADER) ?? "").trim();

  if (!salonId) {
    throw new HttpError(400, "SALON_REQUIRED", `Missing ${SALON_HEADER} header`);
  }

  const userId = req.auth?.user.id;
  if (!userId) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }

  const membership = await prisma.salonMembership.findUnique({
    where: { salonId_userId: { salonId, userId } },
  });

  if (!membership) {
    throw new HttpError(403, "FORBIDDEN", "No access to this salon");
  }

  req.salonId = salonId;
  req.salonRole = membership.role;
  next();
});
