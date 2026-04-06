import type { ErrorRequestHandler } from "express";
import { APIError } from "better-auth";
import { HttpError } from "./http-error.js";
import type { Logger } from "pino";

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err, req, res, _next) => {
    const requestId = req.requestId ?? "—";

    if (err instanceof APIError) {
      const status = typeof err.status === "number" ? err.status : 400;
      logger.warn({ err, requestId, path: req.path }, "APIError");
      res.status(status).json({
        error: {
          code: err.body?.code ?? "AUTH_ERROR",
          message: err.message,
        },
      });
      return;
    }

    if (err instanceof HttpError) {
      logger.warn({ err, requestId, path: req.path }, "HttpError");
      res.status(err.statusCode).json({
        error: {
          code: err.code,
          message: err.message,
        },
      });
      return;
    }

    logger.error({ err, requestId, path: req.path }, "Unhandled error");
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
      },
    });
  };
}
