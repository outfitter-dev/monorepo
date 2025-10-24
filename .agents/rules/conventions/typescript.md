# TypeScript Conventions

- Target ESNext; rely on bundlers/apps to downlevel if needed.
- Enable `strict` options in `tsconfig.json`; do not loosen without discussion.
- Use `type` aliases by default; reserve `interface` for declaration merging or React props when extending.
- Keep module resolution purely ESM. No `require`, no CommonJS shims.
