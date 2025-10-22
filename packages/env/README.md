# @outfitter/env

Shared utilities for loading and validating environment variables in Outfitter
projects. The package standardizes Bun Secrets integration, `.env` handling
for local development, and Zod-powered validation.

## Features

- `validateEnv` to parse and validate environment variables against Zod schemas
- Bun Secrets helpers (`loadBunSecrets`) for production secrets management
- `.env` loader for local workflows and legacy paths
- Profile resolution helpers for development, staging, and production
- Result-based error handling via `@outfitter/validation`

## Usage

```ts
import { validateEnv, loadDotEnv } from "@outfitter/env";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "staging", "production"]),
});

// Load .env in development
if (process.env.NODE_ENV !== "production") {
  loadDotEnv();
}

const env = validateEnv(EnvSchema, {
  defaults: { NODE_ENV: "development" },
});
```

See the package tests for more examples including Bun Secrets integration.

## License

MIT © Outfitter
