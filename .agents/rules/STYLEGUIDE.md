# Style Guide

- Language: TypeScript (strict). Prefer `type` aliases over `interface` unless extending built-in contracts.
- Formatting enforced by Biome via Ultracite—do not add Prettier.
- Import order: external deps → internal packages → relative paths. Use extensionless imports (`.ts` suffix not required).
- Favor immutable data structures and pure functions; avoid shared state in utilities.
- Document exported functions/types with JSDoc when the intent isn’t obvious.
