import { withCors } from "@/lib/cors";
import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

type ResourceType = "image" | "video";

/**
 * Returns a short-lived signed payload so the browser can POST the file
 * directly to Cloudinary (bypasses Vercel’s small request-body limit on videos).
 */
export async function POST(request: Request) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const cloudKey = process.env.CLOUDINARY_API_KEY?.trim();
  const cloudSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !cloudKey || !cloudSecret) {
    return withCors(
      NextResponse.json(
        { error: "Cloudinary not configured" },
        { status: 503 },
      ),
    );
  }

  let resourceType: ResourceType = "image";
  try {
    const body = (await request.json()) as { resourceType?: string };
    if (body.resourceType === "video") resourceType = "video";
    else if (body.resourceType === "image") resourceType = "image";
  } catch {
    return withCors(
      NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: cloudKey,
    api_secret: cloudSecret,
  });

  const id = randomUUID();
  const folder = "salonx/build-station";
  const publicId = `${resourceType === "video" ? "video" : "s1"}/${id}`;
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = {
    folder,
    public_id: publicId,
    timestamp,
    overwrite: "false",
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    cloudSecret,
  );

  return withCors(
    NextResponse.json({
      cloudName,
      apiKey: cloudKey,
      timestamp,
      signature,
      folder,
      publicId,
      resourceType,
    }),
  );
}
