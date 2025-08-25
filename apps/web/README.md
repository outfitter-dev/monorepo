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

In Cloudflare Pages (Dashboard → Pages → Create project → Connect to Git), configure:

- Production branch: `main`
- Build command: (leave empty)
- Build output directory: `public`
- Root directory: repository root (or `apps/web` if connecting the subfolder directly)
- Preview deployments: enabled for PRs

Note: If connecting the monorepo root, set the project "Root directory" to `apps/web` so Pages picks up the `public/` folder correctly.

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
