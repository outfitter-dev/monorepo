# ADR-0011: `@outfitter/config` — unified, multi-format configuration loader

- **Status**: Proposed
- **Date**: 2025-06-20
- **Deciders**: Max

---

## Context

Each application currently rolls its own logic to read `.env` files, local `config.json`, command-line flags, etc. We need a unified approach that supports **JSON, JSONC (with comments), and YAML** while enforcing a single schema.

## Goal

* Single helper that:
  1. discovers config files in standard locations (`$XDG_CONFIG_HOME/outfitter/…` or `~/.config/outfitter/…`), plus cwd.
  2. Supports **json | jsonc | yaml | yml**.
  3. Merges with environment variables and CLI flags (lowest → highest precedence: default < file < env < CLI).
  4. Validates with **Zod** → returns `Result<Config, AppError>`.

## Example

```ts
// packages/config/src/schema.ts
import { z } from 'zod';

export const ConfigSchema = z.object({
  apiUrl: z.string().url(),
  cacheTtl: z.number().int().positive().default(3600),
  features: z.record(z.boolean()).default({}),
});

// app/index.ts
import { loadConfig } from '@outfitter/config';

const config = await loadConfig(ConfigSchema, {
  projectName: 'my-app',
  argv: process.argv, // optional
});

match(config, {
  success: ({ data }) => startServer(data),
  failure: ({ error }) => {
    console.error(humanize(error));
    process.exit(1);
  },
});
```

## API sketch

```ts
interface LoadConfigOptions {
  projectName: string;           // used for xdg path discovery
  configName?: string;           // default "config"
  argv?: string[];               // cli args to parse via yargs
  cwd?: string;                  // search starting dir
}

export function loadConfig<T>(
  schema: z.ZodSchema<T>,
  options: LoadConfigOptions,
): Promise<Result<T, AppError>>;

export const supportedExtensions = ['json', 'jsonc', 'yaml', 'yml'] as const;
```

Internally it will use:

* `fs/promises` to search filenames like `config.yaml`, `config.json`, etc.
* `yaml` package for YAML parsing.
* `import('comment-json')` for JSONC support.

If more than one file exists a **merge** strategy will be applied (later file wins, deep-merged objects).

## Developer Experience

* `npx outfitter init` can scaffold an example `config.yaml` with comments and a matching TypeScript schema.
* `outfitter config --show` CLI helper prints the final resolved config with its sources.

## Alternatives considered

* Use `rc` package – lacks schema validation & TypeScript types.
* Use `convict` – heavy, custom DSL, poor ESM support.

## Roll-out

1. Publish package as `0.x`, adopt by CLI tool first.
2. Replace ad-hoc dotenv parsing in baselayer generators.

---
