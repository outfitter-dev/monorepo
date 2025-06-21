# @outfitter/husky-config

> Shared Git hooks configuration for consistent development workflows across Outfitter projects

## Installation

```bash
npm install --save-dev @outfitter/husky-config
# or
pnpm add -D @outfitter/husky-config
```

## Setup

### Automatic Setup

Run the setup script after installation:

```bash
npx @outfitter/husky-config setup
```

### Manual Setup

1. Initialize husky in your project:

```bash
npx husky init
```

2. Copy the hooks from this package:

```bash
cp -r node_modules/@outfitter/husky-config/hooks/* .husky/
```

## What's Included

### Pre-commit Hook

Runs `lint-staged` to format and lint staged files before committing:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### Commit-msg Hook

Validates commit messages using `commitlint` to ensure they follow conventional commit format:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
```

## Configuration

### lint-staged

Create a `lint-staged.config.mjs` file in your project root:

```javascript
export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': 'prettier --write',
};
```

### commitlint

Create a `commitlint.config.mjs` file in your project root:

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
};
```

## Workflow

1. **Stage your changes**: `git add .`
2. **Commit**: `git commit -m "feat: add new feature"`
3. **Pre-commit**: Automatically formats and lints staged files
4. **Commit-msg**: Validates the commit message format

### Valid Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, semicolons, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes

## Troubleshooting

### Hooks not running

Ensure hooks have execute permissions:

```bash
chmod +x .husky/*
```

### Bypassing hooks (emergency only)

```bash
git commit --no-verify -m "emergency: bypass hooks"
```

**Note**: This should only be used in emergencies. Always ensure your code meets quality standards.

## Development

This package is part of the [@outfitter/monorepo](https://github.com/outfitter-dev/monorepo) monorepo.

See the [Development Guide](../../docs/contributing/development.md) for instructions on building, testing, and contributing to this package.

## License

MIT
