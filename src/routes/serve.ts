import { Elysia } from 'elysia';
import { serveImage } from '../lib/images';
import { publicOrigin } from '../lib/cors';

export const publicRoutes = (env: Env) => new Elysia().get('/*', ({ path, request }) => serveImage(path, env, publicOrigin(request)));
