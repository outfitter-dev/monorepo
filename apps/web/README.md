# @outfitter/web

The main website for outfitter.dev

## Development

```bash
# From monorepo root
bun install
cd apps/web

# Development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Deployment

This site is deployed to Cloudflare Pages.

### Manual Deployment

```bash
# Build and deploy
bun run build
bunx wrangler pages deploy dist --project-name=outfitter-web
```

### Automatic Deployment

Pushes to `main` automatically deploy via GitHub Actions.

## Structure

- `public/` - Static assets served directly
  - `index.html` - Main landing page
- `dist/` - Production build output (git-ignored)
