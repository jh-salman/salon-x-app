import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { HttpError } from "./http-error.js";
import { asyncHandler } from "./async-handler.js";

export const requireAuth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const payload = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!payload) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  req.auth = payload;
  next();
});
