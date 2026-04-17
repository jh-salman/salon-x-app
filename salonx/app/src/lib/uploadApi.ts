import { readV1ErrorMessage, v1Headers, V1_BASE } from './httpV1';

export type UploadImageResponse = {
  data: {
    url: string;
    publicId: string;
    mime: string;
    size: number;
    originalName: string;
  };
};

export async function uploadImage(
  token: string,
  salonId: string,
  input: { uri: string; name?: string; mime?: string },
): Promise<UploadImageResponse> {
  const form = new FormData();
  form.append('file', {
    uri: input.uri,
    name: input.name ?? 'image.jpg',
    type: input.mime ?? 'image/jpeg',
  } as any);

  const h = v1Headers(token, salonId);
  // fetch will set boundary automatically for multipart; don't send JSON content-type here.
  delete (h as any)['Content-Type'];

  const r = await fetch(`${V1_BASE}/uploads`, {
    method: 'POST',
    headers: h as any,
    body: form,
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<UploadImageResponse>;
}

