import { createRequire } from "node:module";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pino from "pino";

/** CJS interop — avoids TS2349 on Vercel / strict ESM default-import typing */
const require = createRequire(import.meta.url);
const helmet = require("helmet") as typeof import("helmet").default;
const rateLimit = require("express-rate-limit") as typeof import("express-rate-limit").default;
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import { auth } from "./lib/auth.js";
import { createErrorHandler } from "./middleware/error-handler.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { requireAuth } from "./middleware/require-auth.js";
import { requireSalonMembership } from "./middleware/require-salon.js";
import { healthRoutes } from "./modules/health/routes.health.js";
import { authModeRoutes } from "./modules/auth/routes.auth.js";
import { userRoutes } from "./modules/user/routes.user.js";
import { salonRoutes } from "./modules/salon/routes.salon.js";
import { salonSettingsRoutes } from "./modules/salon/settings.routes.js";
import { appointmentRoutes } from "./modules/appointment/routes.appointment.js";
import { clientRoutes } from "./modules/client/routes.client.js";
import { serviceRoutes } from "./modules/service/routes.service.js";
import { productRoutes } from "./modules/product/routes.product.js";
import { checkoutRoutes } from "./modules/checkout/routes.checkout.js";
import { businessRoutes } from "./modules/business/routes.business.js";
import { workspaceRoutes } from "./modules/workspace/routes.workspace.js";
import { preferencesRoutes } from "./modules/preferences/routes.preferences.js";
import { workScheduleRoutes } from "./modules/work-schedule/routes.work-schedule.js";
import { assignedServicesRoutes } from "./modules/assigned-services/routes.assigned-services.js";

function createLogger() {
  if (env.NODE_ENV === "development") {
    return pino({
      level: "debug",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    });
  }
  return pino({ level: "info" });
}

export function createApp() {
  const app = express();
  const logger = createLogger();

  if (env.TRUST_PROXY) app.set("trust proxy", 1);

  app.use(requestIdMiddleware);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  /**
   * Better Auth uses better-call, which returns 415 if POST has no Content-Type while JSON is expected.
   * Browsers/clients often omit it on empty bodies (e.g. sign-out).
   */
  app.use((req, _res, next) => {
    const path = req.originalUrl.split("?")[0] ?? "";
    if (
      path.startsWith("/api/auth") &&
      (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") &&
      !req.headers["content-type"]
    ) {
      req.headers["content-type"] = "application/json";
    }
    next();
  });
  app.use(express.json({ limit: "1mb" }));

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      logger.info(
        {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          ms: Date.now() - start,
        },
        "http",
      );
    });
    next();
  });

  app.use("/health", healthRoutes);

  app.use("/api/auth", toNodeHandler(auth));

  const v1Limiter = rateLimit({
    windowMs: 60_000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const v1 = express.Router();
  v1.use(v1Limiter);

  v1.use("/auth", authModeRoutes);

  v1.use("/me", requireAuth, userRoutes);
  v1.use("/salons", requireAuth, salonRoutes);
  v1.use("/salon", requireAuth, requireSalonMembership, salonSettingsRoutes);

  v1.use("/appointments", requireAuth, requireSalonMembership, appointmentRoutes);
  v1.use("/clients", requireAuth, requireSalonMembership, clientRoutes);
  v1.use("/services", requireAuth, requireSalonMembership, serviceRoutes);
  v1.use("/products", requireAuth, requireSalonMembership, productRoutes);
  v1.use("/checkouts", requireAuth, requireSalonMembership, checkoutRoutes);
  v1.use("/business", requireAuth, requireSalonMembership, businessRoutes);
  v1.use("/workspace", requireAuth, requireSalonMembership, workspaceRoutes);
  v1.use("/preferences", requireAuth, requireSalonMembership, preferencesRoutes);
  v1.use("/work-schedule", requireAuth, requireSalonMembership, workScheduleRoutes);
  v1.use("/assigned-services", requireAuth, requireSalonMembership, assignedServicesRoutes);

  app.use("/api/v1", v1);

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}
