# @outfitter/web

The main website for outfitter.dev - a simple static HTML site.

## Development

```bash
# From monorepo root
bun install
cd apps/web

# Local development server (serves public/ at http://localhost:3000)
bun run dev

# Or serve directly with Bun
bunx serve -l 3000 public
```

## Deployment

This site is deployed to Cloudflare Pages as a static site. No build step is required.

### Manual Deployment

```bash
# One-time login (skip if already authenticated)
bunx wrangler login

# Deploy the public directory (creates the project on first run)
bunx wrangler pages deploy public --project-name=outfitter-web
```

### Automatic Deployment

**Option 1: GitHub Actions (Recommended)**

The repository includes a GitHub Actions workflow that automatically deploys to Cloudflare Pages. This approach provides better control and integrates with the monorepo structure.

Prerequisites:
1. Add repository secrets (Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN`: Create at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) with `Cloudflare Pages:Edit` permissions
   - `CLOUDFLARE_ACCOUNT_ID`: Found in your Cloudflare dashboard sidebar

2. Create the workflow file `.github/workflows/deploy-web.yml` (see PR comments for complete workflow)

The workflow will:
- Deploy to production on pushes to `main` branch
- Create preview deployments for pull requests
- Only run when `apps/web/` files change

**Option 2: Cloudflare Pages Git Integration**

Alternatively, connect directly via Cloudflare Pages dashboard:

- Production branch: `main`
- Build command: (leave empty)
- Build output directory: `public`
- Root directory: `apps/web` (monorepo subfolder)
- Preview deployments: enabled for PRs

## Analytics

The site includes Cloudflare Web Analytics for basic page tracking. To configure (and keep it privacy-friendly):

1. Go to Cloudflare Dashboard → Analytics & Logs → Web Analytics
2. Create a new site beacon for the `outfitter.dev` domain
3. Replace `YOUR_TOKEN_HERE` in `public/index.html` with your beacon token
4. Place the script just before `</body>` to avoid blocking rendering
5. In the Web Analytics settings, enable "Respect Do Not Track" (if desired)

## Structure

- `public/` - Static assets served directly
  - `index.html` - Main landing page with inline CSS
- `_headers` (optional) - Cache-control and security headers for Cloudflare Pages
- `_redirects` (optional) - Static redirects (one per line)
- `robots.txt` (optional) - Crawl directives
- `favicon.ico` / `site.webmanifest` (optional) - Icons & PWA manifest
- `wrangler.toml` - Cloudflare Pages deployment configuration
