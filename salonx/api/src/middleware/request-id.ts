import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const id = (req.headers["x-request-id"] as string | undefined) ?? randomUUID();
  req.requestId = id;
  res.setHeader("x-request-id", id);
  next();
};
