import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((s) =>
      s
        ? s.split(",").map((o) => o.trim()).filter(Boolean)
        : ["http://localhost:8081", "http://localhost:19006"],
    ),
  TRUST_PROXY: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
});

export const env = envSchema.parse(process.env);
