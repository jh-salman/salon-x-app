/**
 * Bundled entry for Vercel — default export is the Express app (no `listen()`).
 * Built to `api/server.mjs` via tsup.
 */
import { createApp } from "./app.js";

const app = createApp();
export default app;
