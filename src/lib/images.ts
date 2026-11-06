export async function serveImage(pathname: string, env: Env, origin: string | null): Promise<Response> {
  const corsHeaders = origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : undefined;

  const key = pathname.slice(1);
  if (!key) {
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }

  const object = await env.CLOUDFLARE_IMAGES.get(key);
  if (!object) {
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }

  return new Response(object.body, { headers });
}

export async function deleteImage(key: string, env: Env): Promise<void> {
  await env.CLOUDFLARE_IMAGES.delete(key);
}

export async function putImage(key: string, buffer: ArrayBuffer, contentType: string, env: Env): Promise<void> {
  await env.CLOUDFLARE_IMAGES.put(key, buffer, {
    httpMetadata: { contentType },
  });
}
