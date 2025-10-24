# @outfitter/env

## 1.0.0

Initial stable release of @outfitter/env.

### Features

- Environment validation with Zod schemas via `validateEnv` and `createEnvValidator`
- Bun Secrets integration with `loadBunSecrets` for production secret management
- `.env` file loading with `loadDotEnv` for local development
- Environment profile resolution (`development`, `staging`, `production`)
- Prefix support for multi-tenant applications
- Result-based error handling with detailed diagnostics
- Comprehensive documentation and usage examples
- 44 tests covering core functionality and edge cases
