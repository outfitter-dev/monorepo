# @outfitter/biome-config

This package provides the centralized Biome configuration for the Outfitter monorepo. It enforces consistent code formatting and linting rules across all projects.

## Usage

In any package within the monorepo, create a `biome.json` file and extend this shared configuration:

```json
{
  "extends": [
    "@outfitter/biome-config"
  ]
}
```

This package also includes an ESLint "bridge" configuration for critical rules not yet covered by Biome. Scripts in the root `package.json` will automatically use this bridge.
