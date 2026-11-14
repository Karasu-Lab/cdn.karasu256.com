import { Elysia, status, t } from 'elysia';
import { z } from 'zod';
import { verifyRequest } from '@karasu-lab/utils/server/request-signature';
import { verifyAccountsJwt } from '../lib/auth';
import { issueUploadTicket } from '../lib/upload-ticket';
import { isValidUploadPath } from '../lib/uploads';

const uploadTicketBodySchema = t.Object({
  path: t.String(),
  ttlSeconds: t.Optional(t.Integer({ minimum: 1, maximum: 300 })),
});

const mcpUploadTicketBodySchema = z.object({
  path: z.string(),
  ttlSeconds: z.number().int().min(1).max(300).optional(),
});

/**
 * Issues a short-lived ticket authorizing a single upload to `path`, for
 * callers that can't rely on `POST /upload`'s cookie-based auth reaching
 * them (see `verifyAccountsJwt`). The caller presents the ticket to
 * `POST /upload` instead of a session cookie.
 */
export const uploadTicketRoute = (env: Env) =>
  new Elysia().post(
    '/upload/ticket',
    async ({ request, body, set }) => {
      const uid = await verifyAccountsJwt(request, env);
      if (!uid) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      if (!isValidUploadPath(body.path, uid)) {
        set.status = 400;
        return { error: 'Invalid upload path' };
      }

      const ticket = await issueUploadTicket(uid, body.path, env, body.ttlSeconds);
      return { ticket };
    },
    { body: uploadTicketBodySchema }
  )
  .post(
    '/mcp/upload/ticket',
    async ({ request, body }) => {
      const signature = verifyRequest({
        secret: env.INTERNAL_API_SECRET ?? '',
        method: request.method,
        url: request.url,
        headers: request.headers,
        body,
      });
      if (signature.status !== 'valid' || !env.INTERNAL_API_SECRET) throw status(401, 'Unauthorized');

      const uid = await verifyAccountsJwt(request, env);
      if (!uid) throw status(401, 'Unauthorized');

      const parsed = mcpUploadTicketBodySchema.safeParse(JSON.parse(body));
      if (!parsed.success || !isValidUploadPath(parsed.data.path, uid)) throw status(400, 'Invalid upload path');

      return { ticket: await issueUploadTicket(uid, parsed.data.path, env, parsed.data.ttlSeconds) };
    },
    { parse: 'text' }
  );
