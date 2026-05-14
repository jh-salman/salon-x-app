import { configJsonWithMeta } from "@/lib/config-response";
import { corsHeaders } from "@/lib/cors";
import { readConfigForLiveApp, readConfigWithMeta } from "@/lib/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_MS_WEB = 350;
const POLL_MS_ADMIN = 1200;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...corsHeaders } });
}

/**
 * Server-Sent Events: pushes config when the watched revision changes.
 * `?forWeb=1` — pushes when **published** snapshot changes (Apply to App → `webProjectionAt`). Polls about every 350ms.
 * Default — admin UI: notifies on draft `revision` changes.
 */
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const url = new URL(request.url);
  const forWeb = url.searchParams.get("forWeb") === "1";
  const pollMs = forWeb ? POLL_MS_WEB : POLL_MS_ADMIN;
  let lastToken = "";

  const stream = new ReadableStream({
    async start(controller) {
      const writeSse = (data: string) => {
        controller.enqueue(encoder.encode(data));
      };

      writeSse(`retry: ${pollMs}\n\n`);

      try {
        while (!request.signal.aborted) {
          if (forWeb) {
            const { config, webProjectionRevision } =
              await readConfigForLiveApp();
            if (webProjectionRevision !== lastToken) {
              lastToken = webProjectionRevision;
              const payload = JSON.stringify(
                configJsonWithMeta(config, request, webProjectionRevision),
              );
              writeSse(`data: ${payload}\n\n`);
            }
          } else {
            const { config, revision, webProjectionRevision } =
              await readConfigWithMeta();
            if (revision !== lastToken) {
              lastToken = revision;
              const payload = JSON.stringify(
                configJsonWithMeta(config, request, webProjectionRevision),
              );
              writeSse(`data: ${payload}\n\n`);
            }
          }
          await new Promise<void>((resolve) => {
            const t = setTimeout(resolve, pollMs);
            request.signal.addEventListener("abort", () => {
              clearTimeout(t);
              resolve();
            });
          });
        }
      } catch {
        /* client gone */
      } finally {
        try {
          controller.close();
        } catch {
          /* */
        }
      }
    },
    cancel() {
      /* */
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
