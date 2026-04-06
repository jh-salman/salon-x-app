import { isUsaE164 } from "./phone-us.js";
import { HttpError } from "../middleware/http-error.js";

/** Normalize business contact phone to E.164 US; throws if invalid. */
export function normalizeBusinessPhoneE164(raw: string): string {
  const p = raw.trim();
  if (!isUsaE164(p)) {
    throw new HttpError(400, "INVALID_PHONE", "Use a valid US business phone (+1…).");
  }
  return p;
}
