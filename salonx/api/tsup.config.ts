import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/server.ts"],
    format: ["esm"],
    platform: "node",
    target: "node20",
    outDir: "api",
    outExtension: () => ({ js: ".mjs" }),
    clean: true,
    skipNodeModulesBundle: true,
    shims: true,
    external: ["pg-native", "@prisma/client", "prisma", ".prisma/client"],
    bundle: true,
    sourcemap: true,
  },
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    platform: "node",
    target: "node20",
    outDir: "dist",
    outExtension: () => ({ js: ".mjs" }),
    clean: true,
    skipNodeModulesBundle: true,
    shims: true,
    external: ["pg-native", "@prisma/client", "prisma", ".prisma/client"],
    bundle: true,
    sourcemap: true,
  },
]);
