# @outfitter/config

Type-safe configuration schema, defaults, and helpers for Outfitter tooling.

## Features

- Zod schema for validating `outfitter.config` files
- Rich TypeScript types for feature flags, overrides, and project context
- Helpers to parse user configuration and merge with opinionated defaults
- JSON Schema export for IDE IntelliSense

## Usage

```ts
import {
  DEFAULT_OUTFITTER_CONFIG,
  parseOutfitterConfig,
  mergeOutfitterConfig,
  type OutfitterConfig,
} from "@outfitter/config";

const config: OutfitterConfig = parseOutfitterConfig({
  features: {
    markdown: true,
    packages: true,
  },
});

const merged = mergeOutfitterConfig({
  overrides: {
    biome: {
      formatter: {
        indentStyle: "space",
      },
    },
  },
});

console.log(DEFAULT_OUTFITTER_CONFIG.features.typescript); // true
```

To inspect validation errors without throwing, use `safeParseOutfitterConfig` which returns an Outfitter `Result`.

## License

MIT © Outfitter
