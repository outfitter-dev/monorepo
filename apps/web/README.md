# @outfitter/web

The main website for outfitter.dev - a simple static HTML site.

## Development

```bash
# From monorepo root
# Requires Bun >= 1.1
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

Tip: You can codify the project/output in wrangler.toml so flags aren't needed:

```toml
# apps/web/wrangler.toml
name = "outfitter-web"
pages_build_output_dir = "public"
```

Preview deploys (e.g. from a feature branch) can be created with:

```bash
bunx wrangler pages deploy --branch feature/my-branch
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
- Build command: (leave empty)
- Build output directory: `public`
- Root directory: `apps/web` (monorepo subfolder)
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
  - `index.html` - Main landing page with inline CSS
- `_headers` (optional) - Cache-control and security headers for Cloudflare Pages
- `_redirects` (optional) - Static redirects (one per line)
- `robots.txt` (optional) - Crawl directives
- `favicon.ico` / `site.webmanifest` (optional) - Icons & PWA manifest
- `404.html` (optional) - Custom 404 page for friendlier not-found handling
- `wrangler.toml` - Cloudflare Pages deployment configuration

Example `_headers`:

```
# HTML: revalidate fast to pick up content changes
/*                # all paths default
  Cache-Control: no-cache
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), microphone=(), usb=()
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# Long-cache for static assets if/when added (hashed filenames recommended)
/_assets/*
  Cache-Control: public, max-age=31536000, immutable
```
