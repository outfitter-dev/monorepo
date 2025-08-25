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
# Deploy the public directory directly
bunx wrangler pages deploy public --project-name=outfitter-web
```

### Automatic Deployment

Configure Cloudflare Pages to deploy from the `public/` directory on pushes to `main`.

## Analytics

The site includes Cloudflare Web Analytics for basic page tracking. To configure:

1. Go to your Cloudflare dashboard → Analytics & Logs → Web Analytics
2. Create a new site beacon for `outfitter.dev`
3. Replace `YOUR_TOKEN_HERE` in `public/index.html` with your beacon token

## Structure

- `public/` - Static assets served directly
  - `index.html` - Main landing page with inline CSS
- `wrangler.toml` - Cloudflare Pages deployment configuration
