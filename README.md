# cdn.karasu256.com

The CDN worker for Karasu Lab — serves images from R2 and accepts ticketed uploads — running on Cloudflare Workers. Split out of [Karasu-Lab/Karasu-Lab](https://github.com/Karasu-Lab/Karasu-Lab).

## Profile avatars

Profile avatars are stored in R2 at `u/profiles/:id/avatar.png` and served by the existing public `GET` route (`src/routes/serve.ts`) like any other object; this worker needs no avatar-specific code. Because responses are cached as `immutable`, avatar URLs carry a `?v=<first 16 hex digits of the SHA-256>` query so a new upload gets a new URL.

Avatars are not uploaded through this worker. The flow is:

1. accounts.karasu256.com's server decides the upload path, computes the file's SHA-256, content type and size, and issues a presigned R2 `PUT` URL.
2. The client `PUT`s the file directly to R2 at `u/profiles/:id/avatar.png`.
3. accounts.karasu256.com's server then calls `POST /upload/verify` on api.karasu256.com, which re-hashes the object in R2, compares it with the declared values, and on a match saves the record to this CDN's database (the `cdn_files` table in Cloudflare D1, keyed by the path on this CDN).
4. When the avatar is displayed, accounts.karasu256.com's server checks it with `GET /upload/verify?path=&uploaderId=` on api.karasu256.com and only fetches it from this CDN's public URL when the check passes.

## Required environment variables

Both jobs are thin wrappers around the shared [`deploy-worker`](https://github.com/Karasu-Lab/Workers) action (`Karasu-Lab/Workers/deploy-worker@v1`): the workflow only maps this app's names into the environment and passes its commands as parameters, and the action assembles the workspace, deploys, and prunes branch Previews to the newest five. The deploy workflow (`.github/workflows/cdn-deploy.yml`) reads the following GitHub Actions secrets and variables, organized by GitHub Environments. The production job runs in the `production` environment and the preview job in the `preview` environment (a `development` environment also exists); register each name at repository level as the default, and override it inside an environment only where that environment needs a different value — a name an environment does not define falls back to the repository-level entry. Values are never committed to the repository.

### Deployment

| Name | Kind | Used for |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Secret | Authenticating wrangler against Cloudflare |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | The Cloudflare account the worker is deployed to |

### Worker secrets

These are synced to the production worker on every deploy to `main`.

| Name | Used for |
| --- | --- |
| `UPLOAD_TICKET_SECRET` | Signing and verifying the short-lived upload tickets |
| `CRON_JOBS_API_KEY` | Shared secret identifying the cron-jobs worker as a trusted caller (must match the value on the cron-jobs worker) |
| `VERCEL_PROTECTION_BYPASS_SECRET` | Bypass secret for reaching Vercel-protected deployments; optional, normally unset in production |

If one of these secrets is unset, the sync falls back to the local default committed in `wrangler.toml`'s `[env.local.vars]`, and skips the entry when it is defined in neither place.

### Branch previews

Pushes to non-`main` branches create or update a preview deployment of the same single worker (`wrangler preview`), named after the branch. Previews resolve the same secret names from the `preview` environment.
