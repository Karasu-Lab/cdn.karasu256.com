# cdn.karasu256.com

The CDN worker for Karasu Lab — serves images from R2 and accepts ticketed uploads — running on Cloudflare Workers. Split out of [Karasu-Lab/Karasu-Lab](https://github.com/Karasu-Lab/Karasu-Lab).

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
