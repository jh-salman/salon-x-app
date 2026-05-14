export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, If-None-Match",
  "Access-Control-Expose-Headers": "ETag",
} as const;

export function withCors(
  res: Response,
  headers: Record<string, string> = {},
): Response {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders)) {
    h.set(k, v);
  }
  for (const [k, v] of Object.entries(headers)) {
    h.set(k, v);
  }
  return new Response(res.body, { status: res.status, headers: h });
}
