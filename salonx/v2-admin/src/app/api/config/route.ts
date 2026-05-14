import {
  type ConfigApiPatch,
  applyConfigApiPatch,
  isSlotAdjust,
  normalizeBrand,
} from "@/lib/salonx-config";
import { configJsonWithMeta } from "@/lib/config-response";
import { withCors } from "@/lib/cors";
import { readConfigForLiveApp, readConfigWithMeta, writeConfig } from "@/lib/store";
import { createHash } from "crypto";
import { NextResponse } from "next/server";

function configEtag(forWeb: boolean, syncToken: string): string {
  const h = createHash("sha1")
    .update(forWeb ? `w:${syncToken}` : `a:${syncToken}`)
    .digest("hex")
    .slice(0, 20);
  return `"sx-${h}"`;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const forWeb = url.searchParams.get("forWeb") === "1";

  if (forWeb) {
    const { config, webProjectionRevision } = await readConfigForLiveApp();
    const body = configJsonWithMeta(config, request, webProjectionRevision);
    const etag = configEtag(true, webProjectionRevision);
    const inm = request.headers.get("if-none-match");
    if (inm && inm === etag) {
      return withCors(
        new NextResponse(null, {
          status: 304,
          headers: {
            ETag: etag,
            "Cache-Control": "private, max-age=0, must-revalidate",
          },
        }),
      );
    }
    return withCors(
      NextResponse.json(body, {
        headers: {
          ETag: etag,
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }),
    );
  }

  const { config, revision, webProjectionRevision } = await readConfigWithMeta();
  const body = configJsonWithMeta(config, request, webProjectionRevision);
  const etag = configEtag(false, webProjectionRevision);
  return withCors(
    NextResponse.json(body, {
      headers: { "Cache-Control": "no-store", ETag: etag },
    }),
  );
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object") {
      return withCors(
        NextResponse.json({ error: "Expected JSON object" }, { status: 400 }),
      );
    }
    const b = body as Record<string, unknown>;
    const { config: current } = await readConfigWithMeta();

    if (typeof b.removeBrandId === "string" && b.removeBrandId) {
      if (current.brands.length <= 1) {
        return withCors(
          NextResponse.json({ error: "Cannot remove the last brand" }, { status: 400 }),
        );
      }
    }

    const patch: ConfigApiPatch = {};

    if (typeof b.activeBrandId === "string") {
      patch.activeBrandId = b.activeBrandId;
    }

    if (typeof b.primaryHex === "string") {
      patch.primaryHex = b.primaryHex;
    }

    const s1 = b.s1Demo;
    if (s1 && typeof s1 === "object") {
      patch.s1Demo = {};
      const im = (s1 as { images?: unknown }).images;
      if (im && typeof im === "object") {
        patch.s1Demo.images = {};
        for (const key of Object.keys(im)) {
          const v = (im as Record<string, unknown>)[key];
          if (typeof v === "string") {
            (patch.s1Demo.images as Record<string, string>)[key] = v;
          }
        }
      }
      const ad = (s1 as { adjust?: unknown }).adjust;
      if (ad && typeof ad === "object") {
        patch.s1Demo.adjust = {};
        for (const key of Object.keys(ad)) {
          const a = (ad as Record<string, unknown>)[key];
          if (isSlotAdjust(a)) {
            (patch.s1Demo.adjust as Record<string, typeof a>)[key] = a;
          }
        }
      }
    }

    if (b.addBrand && typeof b.addBrand === "object") {
      const ab = b.addBrand as { name?: string };
      patch.addBrand = { name: typeof ab.name === "string" ? ab.name : undefined };
    }

    if (typeof b.removeBrandId === "string") {
      patch.removeBrandId = b.removeBrandId;
    }

    if (b.saveBrand && typeof b.saveBrand === "object") {
      const sb = b.saveBrand as Record<string, unknown>;
      const id = typeof sb.id === "string" ? sb.id : "";
      const name = typeof sb.name === "string" ? sb.name : "Brand";
      patch.saveBrand = normalizeBrand(sb, id || "unknown", name);
    }

    const next = applyConfigApiPatch(current, patch);
    const publishToApp = b.publishToApp === true;
    await writeConfig(next, { publishToApp });
    const { config: persisted, webProjectionRevision } =
      await readConfigWithMeta();
    return withCors(
      NextResponse.json(
        configJsonWithMeta(persisted, request, webProjectionRevision),
      ),
    );
  } catch {
    return withCors(
      NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    );
  }
}
