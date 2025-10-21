# Monorepo Structure Rules

- `apps/`: Executable surfaces (CLI entrypoints, web apps). Each app owns its own configuration file (env, bunfig overrides) and depends on published packages.
- `packages/`: Publishable libraries. Namespace them as `@outfitter/<package>` and keep `package.json` lean (exports, types, scripts). Add README + CHANGELOG once the package ships.
- `scripts/`: Future home for shared automation. Keep `scripts/` Bun-based and stateless.
- Workspace root hosts `bunfig.toml`, `lefthook.yml`, `biome.json`, `ultracite.config.json`, `vitest.config.ts`, and global lint/test scripts. Do not duplicate these in packages unless a package has special needs (document the divergence).
- Generated assets (`dist`, `coverage`, tmp fixtures) must stay out of git—update `.gitignore` when introducing new tooling.
