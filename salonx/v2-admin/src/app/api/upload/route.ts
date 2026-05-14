import { withCors } from "@/lib/cors";
import { publicSiteOrigin } from "@/lib/public-url";
import { randomUUID } from "crypto";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function extFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/gif") return "gif";
  if (mime === "image/webp") return "webp";
  if (mime === "image/heic" || mime === "image/heif") return "heic";
  if (mime.startsWith("video/")) {
    if (mime === "video/webm") return "webm";
    if (mime === "video/quicktime") return "mov";
    if (mime === "video/x-msvideo") return "avi";
    return "mp4";
  }
  return "jpg";
}

function sniffMime(file: File, fallback: string): string {
  let mime = (file.type || "").toLowerCase();
  if (mime) return mime;
  const name = file.name.toLowerCase();
  if (/\.(jpe?g)$/.test(name)) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".heic") || name.endsWith(".heif")) return "image/heic";
  if (name.endsWith(".mp4") || name.endsWith(".m4v")) return "video/mp4";
  if (name.endsWith(".webm")) return "video/webm";
  if (name.endsWith(".mov")) return "video/quicktime";
  if (name.endsWith(".avi")) return "video/x-msvideo";
  return fallback;
}

function normalizeMime(raw: string, file: File): string {
  let mime = (raw || "").toLowerCase();
  if (!mime.startsWith("image/") && !mime.startsWith("video/")) {
    mime = sniffMime(file, "image/jpeg");
  }
  if (mime.startsWith("image/") && !IMAGE_MIMES.has(mime)) {
    if (mime === "image/jpg") return "image/jpeg";
    return "image/jpeg";
  }
  if (mime === "application/octet-stream") {
    const n = file.name.toLowerCase();
    if (/\.(mp4|m4v)$/.test(n)) return "video/mp4";
    if (/\.webm$/.test(n)) return "video/webm";
    if (/\.mov$/.test(n)) return "video/quicktime";
  }
  return mime;
}

function isAllowedMime(mime: string): boolean {
  if (mime.startsWith("image/")) {
    return mime !== "image/svg+xml";
  }
  if (mime.startsWith("video/")) return true;
  return false;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return withCors(
      NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 }),
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return withCors(
      NextResponse.json({ error: "Could not read form data" }, { status: 400 }),
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return withCors(
      NextResponse.json({ error: "Missing file field" }, { status: 400 }),
    );
  }

  const uploadFile = file;

  const mime = normalizeMime(uploadFile.type, uploadFile);
  if (!isAllowedMime(mime)) {
    return withCors(
      NextResponse.json({ error: "Unsupported file type" }, { status: 400 }),
    );
  }

  const isVideo = mime.startsWith("video/");
  const id = randomUUID();
  const ext = extFor(mime);
  const filename = `${id}.${ext}`;

  /** Avoid loading whole file into RAM when the runtime exposes a Web ReadableStream. */
  async function fileToNodeReadable(): Promise<Readable> {
    const streamFn = (uploadFile as File & { stream?: () => ReadableStream })
      .stream;
    if (typeof streamFn === "function") {
      try {
        return Readable.fromWeb(
          streamFn.call(uploadFile) as import("stream/web").ReadableStream,
        );
      } catch {
        /* fall through */
      }
    }
    return Readable.from(Buffer.from(await uploadFile.arrayBuffer()));
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const cloudKey = process.env.CLOUDINARY_API_KEY?.trim();
  const cloudSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (cloudName && cloudKey && cloudSecret) {
    const { v2: cld } = await import("cloudinary");
    cld.config({
      cloud_name: cloudName,
      api_key: cloudKey,
      api_secret: cloudSecret,
    });
    const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cld.uploader.upload_stream(
        {
          folder: "salonx/build-station",
          public_id: `${isVideo ? "video" : "s1"}/${id}`,
          resource_type: isVideo ? "video" : "image",
          overwrite: false,
        },
        (err, result) => {
          if (err) reject(err);
          else if (!result?.secure_url) reject(new Error("Cloudinary upload failed"));
          else resolve(result as { secure_url: string });
        },
      );
      void (async () => {
        try {
          const src = await fileToNodeReadable();
          await pipeline(src, uploadStream);
        } catch (e) {
          reject(e);
        }
      })();
    });
    return withCors(
      NextResponse.json({
        url: uploaded.secure_url,
        path: uploaded.secure_url,
        storage: "cloudinary",
      }),
    );
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`s1/${filename}`, uploadFile, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      contentType: mime,
    });
    return withCors(
      NextResponse.json({
        url: blob.url,
        path: blob.url,
        storage: "vercel-blob",
      }),
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const absPath = path.join(uploadDir, filename);

  const ws = createWriteStream(absPath);
  const src = await fileToNodeReadable();
  await pipeline(src, ws);

  const origin = publicSiteOrigin(request);
  const url = `${origin}/uploads/${filename}`;
  return withCors(
    NextResponse.json({
      url,
      path: `/uploads/${filename}`,
      storage: "local-disk",
    }),
  );
}
