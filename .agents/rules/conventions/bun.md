# Bun Command Conventions

- Use `bun run <script>` for workspace scripts defined in `package.json`.
- Prefer `bunx` to execute local CLIs (e.g., `bunx ultracite fix .`).
- For ad-hoc scripts, create a dedicated file under `scripts/` and invoke it via `bun run`.
- Do not mix npm/yarn/pnpm commands in documentation or scripts.
