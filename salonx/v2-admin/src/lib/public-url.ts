/** Base URL for absolute links to uploaded assets (e.g. from salonx-web-v2). */
export function requestOrigin(request: Request): string {
  const host = request.headers.get("host");
  if (!host) return "http://localhost:3000";
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
  return `${proto}://${host}`;
}

/** Stable public URL when deployed (set on Vercel / reverse proxy). Falls back to request host. */
export function publicSiteOrigin(request: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "");
  if (env) return env;
  return requestOrigin(request);
}
