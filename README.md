# cdn.karasu256.com

The CDN worker for Karasu Lab — serves images from R2 and accepts ticketed uploads — running on Cloudflare Workers. Split out of [Karasu-Lab/karasu256.com](https://github.com/Karasu-Lab/karasu256.com).

## Required environment variables

The deploy workflow (`.github/workflows/cdn-deploy.yml`) reads the following GitHub Actions secrets and variables. Register them on this repository under exactly these names. Values are never committed to the repository.

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

Pushes to non-`main` branches create or update a preview deployment of the same single worker (`wrangler preview`), named after the branch. Previews use the `PREVIEW_` variants of the worker secrets: `PREVIEW_UPLOAD_TICKET_SECRET`, `PREVIEW_CRON_JOBS_API_KEY`, `PREVIEW_VERCEL_PROTECTION_BYPASS_SECRET`.
