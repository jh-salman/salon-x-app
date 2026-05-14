type SignPayload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  resourceType: "image" | "video";
};

async function fetchSignPayload(
  resourceType: "image" | "video",
): Promise<SignPayload | null> {
  const res = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resourceType }),
  });
  if (!res.ok) return null;
  try {
    return (await res.json()) as SignPayload;
  } catch {
    return null;
  }
}

/**
 * Upload a file straight to Cloudinary from the browser (signed).
 * Use for large videos so the file never transits through the Next.js route body limit.
 */
export async function uploadToCloudinaryFromBrowser(
  file: File,
  resourceType: "image" | "video",
): Promise<string> {
  const sig = await fetchSignPayload(resourceType);
  if (!sig) throw new Error("sign");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("signature", sig.signature);
  fd.append("folder", sig.folder);
  fd.append("public_id", sig.publicId);
  fd.append("overwrite", "false");

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(sig.cloudName)}/${sig.resourceType}/upload`;
  const res = await fetch(endpoint, { method: "POST", body: fd });
  const data = (await res.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || "cloudinary");
  }
  const url = data.secure_url;
  if (!url || typeof url !== "string") throw new Error("no url");
  return url;
}
