import { Elysia } from 'elysia';
import { z } from 'zod';
import { putImage } from '../lib/images';
import { verifyTicketToken } from '../lib/upload-ticket';
import { ALLOWED_TYPES, MAX_FILE_BYTES } from '../lib/uploads';

export const signedUploadRoute = (env: Env) =>
  new Elysia().put(
    '/upload/signed',
    async ({ request, query, set }) => {
      const parsed = z.object({ path: z.string().min(1), ticket: z.string().min(1) }).safeParse(query);
      if (!parsed.success || !(await verifyTicketToken(parsed.data.ticket, parsed.data.path, env))) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      const contentType = request.headers.get('content-type') ?? '';
      if (!ALLOWED_TYPES.has(contentType)) {
        set.status = 400;
        return { error: 'Unsupported image type. Allowed: jpeg, png, webp.' };
      }

      const body = await request.arrayBuffer();
      if (body.byteLength === 0 || body.byteLength > MAX_FILE_BYTES) {
        set.status = 413;
        return { error: 'File exceeds 5 MB limit' };
      }

      await putImage(parsed.data.path, body, contentType, env);
      return { url: `${env.CDN_BASE_URL}/${parsed.data.path}` };
    },
    { parse: 'none' }
  );
