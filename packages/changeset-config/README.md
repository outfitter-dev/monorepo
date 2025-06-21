# @outfitter/changeset-config

> Shared changesets configuration for consistent release management across Outfitter projects

## Installation

```bash
npm install --save-dev @outfitter/changeset-config
# or
pnpm add -D @outfitter/changeset-config
```

## Usage

Reference this package in your project's `.changeset/config.json`:

```json
{
  "extends": "@outfitter/changeset-config/config"
}
```

Or copy the configuration directly:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

## Configuration Details

### Key Settings

- **`changelog`**: Uses the default changesets changelog generator
- **`commit`**: Set to `false` - commits are handled separately
- **`access`**: Set to `public` for npm publishing
- **`baseBranch`**: Uses `main` as the base branch
- **`updateInternalDependencies`**: Set to `patch` for internal dependency updates

### Working with Changesets

```bash
# Create a new changeset
pnpm changeset

# Version packages based on changesets
pnpm changeset:version

# Publish packages
pnpm changeset:publish
```

## Why Use This?

- **Consistency**: All Outfitter projects use the same release workflow
- **Simplicity**: Pre-configured for common use cases
- **Flexibility**: Can be extended or overridden as needed

## Development

This package is part of the [@outfitter/monorepo](https://github.com/outfitter-dev/monorepo) monorepo.

See the [Development Guide](../../docs/contributing/development.md) for instructions on building, testing, and contributing to this package.

## License

MIT
