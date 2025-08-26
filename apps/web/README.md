# @outfitter/web

The main website for outfitter.dev - a simple static HTML site.

## Development

```bash
# From monorepo root
bun install
cd apps/web

# Local development preview (serves public/ at http://localhost:3030)
bun run dev
```

## Deployment

This site is deployed to Cloudflare Pages. The `public/` directory is served directly with no build step required.

### Manual Deployment

```bash
# Deploy to Cloudflare Pages
bun run deploy

# Or for preview deployments from feature branches:
bunx wrangler pages deploy public --branch=feature/my-branch
```

### Automatic Deployment

**Option 1: GitHub Actions (Recommended)**

Use a GitHub Actions workflow to automatically deploy to Cloudflare Pages. This approach provides better control and integrates with the monorepo structure.

Prerequisites:

1. Add repository secrets (Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN`: Create at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) with the smallest practical scope (typically "Cloudflare Pages: Edit" and "Account: Read")
   - `CLOUDFLARE_ACCOUNT_ID`: Found in your Cloudflare dashboard sidebar

2. Create the workflow file `.github/workflows/deploy-web.yml` (see PR comments for complete workflow)

The workflow will:

- Deploy to production on pushes to `main` branch
- Create preview deployments for pull requests
- Only run when `apps/web/` files change

**Option 2: Cloudflare Pages Git Integration**

Alternatively, connect directly via Cloudflare Pages dashboard:

- Production branch: `main`
- Build command: (leave empty - no build step)
- Build output directory: `apps/web/public`
- Root directory: `/` (monorepo root)
- Preview deployments: enabled for PRs
- Custom domain: connect `outfitter.dev` and enable "Always use HTTPS"

## Analytics

The site includes Cloudflare Web Analytics for basic page tracking. To configure (and keep it privacy-friendly):

1. Go to Cloudflare Dashboard → Analytics & Logs → Web Analytics
2. Create a new site beacon for the `outfitter.dev` domain
3. Replace `YOUR_TOKEN_HERE` in `public/index.html` with your beacon token
4. Place the script just before `</body>` to avoid blocking rendering
5. In the Web Analytics settings, enable "Respect Do Not Track" (if desired)

Since the site aims for near zero JS, you can strip the beacon on preview deployments or when the token isn't set to keep previews script-free.

## Structure

- `public/` - Static assets served directly
  - `index.html` - Main landing page with inline CSS and minimal JavaScript
- `wrangler.toml` - Cloudflare Pages deployment configuration

Security headers can be configured via `public/_headers` file when needed.
