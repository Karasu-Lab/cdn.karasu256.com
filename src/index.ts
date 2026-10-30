import { Elysia } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { env as cfEnv } from 'cloudflare:workers';
import { resolveEnv } from './constants';
import { publicRoutes } from './routes/serve';
import { protectedRoutes } from './routes/protected';

const env = resolveEnv(cfEnv as Env);

export default new Elysia({ adapter: CloudflareAdapter }).use(publicRoutes(env)).use(protectedRoutes(env)).compile();
