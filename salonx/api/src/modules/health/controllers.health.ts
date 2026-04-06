import type { Request, Response } from "express";
import { healthService } from "./services.health.js";

const startedAt = Date.now();

export const healthController = {
  /** Liveness: process is up (no external checks). */
  live(_req: Request, res: Response) {
    res.json({
      status: "ok",
      service: "salon-x-api",
      uptimeMs: Date.now() - startedAt,
    });
  },

  /** Readiness: database reachable. */
  async ready(_req: Request, res: Response) {
    const db = await healthService.pingDatabase();
    if (!db.ok) {
      res.status(503).json({
        status: "not_ready",
        checks: {
          database: { status: "error", detail: db.error },
        },
      });
      return;
    }
    res.json({
      status: "ok",
      checks: {
        database: { status: "ok" },
      },
    });
  },
};
