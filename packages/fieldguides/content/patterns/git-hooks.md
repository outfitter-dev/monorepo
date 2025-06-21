---
slug: git-hooks
title: 'Git Hooks and Pre-commit Configuration'
description: 'Automated code quality checks before commits and pushes.'
type: pattern
---

# Git Hooks and Pre-commit Configuration

Automated code quality checks before commits and pushes.

## Related Documentation

- [Testing Standards](../standards/testing-standards.md) - Test automation practices
- [TypeScript Standards](../standards/typescript-standards.md) - Code quality checks
- [GitHub Actions](./github-actions.md) - CI/CD integration
- [Security Scanning](./security-scanning.md) - Security checks

## Husky Setup

Modern Git hooks management with Husky v9:

```bash
# Install Husky and lint-staged
pnpm add -D husky lint-staged

# Initialize Husky (creates .husky directory)
pnpm exec husky init

# Add prepare script to package.json
npm pkg set scripts.prepare="husky"

# Install Git hooks
pnpm run prepare
```

## Pre-commit Hook

### Basic Setup

`.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged for incremental checks
pnpm exec lint-staged --concurrent false

# Check for debugging code in staged files only
staged_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)
if [ -n "$staged_files" ]; then
  if echo "$staged_files" | xargs grep -l "console\.log\|debugger" 2>/dev/null; then
    echo "❌ Found console.log or debugger statements in staged files"
    exit 1
  fi
fi
```

### Lint-staged Configuration

`package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix --max-warnings 0", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"],
    "*.{css,scss,less}": ["stylelint --fix", "prettier --write"],
    "package.json": ["npx sort-package-json"],
    "*.{test,spec}.{ts,tsx,js,jsx}": ["vitest related --run"],
    "*.sql": ["npx sql-formatter --config .sql-formatter.json"]
  }
}
```

### Advanced Configuration

`.lintstagedrc.mjs`:

```javascript
import micromatch from 'micromatch';

export default {
  '*.{ts,tsx}': async files => {
    const match = micromatch.not(files, ['**/*.d.ts', '**/*.generated.ts']);

    if (match.length === 0) return [];

    return [
      `eslint --fix --max-warnings 0 ${match.join(' ')}`,
      `prettier --write ${match.join(' ')}`,
      'tsc --noEmit --incremental false',
      `vitest related ${match.join(' ')} --run`,
    ];
  },

  '*.{graphql,gql}': ['graphql-schema-linter', 'prettier --write'],

  'src/**/*.{ts,tsx}': () => [
    'pnpm run test:types',
    'pnpm run test:circular-deps',
    'npx madge --circular --extensions ts,tsx src/',
  ],

  '*.{yml,yaml}': ['yamllint -c .yamllint.yml'],
};
```

## Pre-push Hook

### Security and Quality Checks

`.husky/pre-push`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Check for secrets using multiple tools
echo "🔍 Scanning for secrets..."
if command -v gitleaks &> /dev/null; then
  gitleaks detect --no-git --verbose
else
  npx secretlint "**/*" --secretlintignore .gitignore
fi

# Run security audit with better reporting
echo "🔒 Running security audit..."
pnpm audit --audit-level=moderate || {
  echo "⚠️  Security vulnerabilities found. Run 'pnpm audit' for details."
  exit 1
}

# Run all tests with coverage
echo "🧪 Running tests..."
pnpm run test:coverage

# Check bundle size
echo "📦 Checking bundle size..."
pnpm run build
if [ -f ".size-limit.json" ]; then
  npx size-limit
fi

# Validate commits
echo "📝 Validating commit messages..."
npx commitlint --from origin/main --to HEAD

# Check for TODO/FIXME comments
echo "📌 Checking for TODO comments..."
if grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" src/; then
  echo "⚠️  Found TODO/FIXME comments. Please address or create issues."
fi
```

## Commit Message Hook

### Conventional Commits

`.husky/commit-msg`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit ${1}
```

`commitlint.config.mjs`:

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Formatting
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf', // Performance improvement
        'test', // Adding tests
        'chore', // Maintenance
        'revert', // Revert a commit
        'build', // Build system
        'ci', // CI configuration
        'security', // Security fixes
        'deps', // Dependency updates
      ],
    ],
    'scope-enum': [
      1, // Warning level to allow custom scopes
      'always',
      [
        'api',
        'auth',
        'ui',
        'db',
        'deps',
        'config',
        'release',
        'infra',
        'dx', // Developer experience
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
  },
  prompt: {
    questions: {
      type: {
        description: 'Select the type of change',
        enum: {
          feat: {
            description: 'A new feature',
            title: 'Features',
            emoji: '✨',
          },
          fix: {
            description: 'A bug fix',
            title: 'Bug Fixes',
            emoji: '🐛',
          },
        },
      },
    },
  },
};
```

## Advanced Hooks

### Branch Protection

`.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Prevent commits to protected branches
protected_branches=("main" "master" "production" "staging")
current_branch=$(git rev-parse --abbrev-ref HEAD)

for branch in "${protected_branches[@]}"; do
  if [[ "$current_branch" == "$branch" ]]; then
    echo "❌ Direct commits to $branch branch are not allowed!"
    echo "Please create a feature branch and submit a pull request."
    echo "To create a feature branch: git checkout -b feat/your-feature-name"
    exit 1
  fi
done

# Warn about WIP commits
if git diff --cached --name-only | xargs grep -E "(WIP|wip|Work in progress)" 2>/dev/null; then
  echo "⚠️  Found WIP markers in staged files"
  read -p "Continue with commit? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Continue with other checks
pnpm exec lint-staged
```

### File Size and Type Validation

`.husky/pre-commit` (addition):

```bash
#!/usr/bin/env sh
# Check for large files and binary files
maxsize=5242880 # 5MB in bytes
warn_size=1048576 # 1MB warning threshold

# Prohibited file extensions
prohibited_extensions=".exe .dll .so .dylib .zip .tar .gz .rar .7z"

for file in $(git diff --cached --name-only); do
  if [ -f "$file" ]; then
    # Check file size
    size=$(wc -c < "$file")
    if [ $size -gt $maxsize ]; then
      echo "❌ File $file is larger than 5MB ($size bytes)"
      echo "Consider using Git LFS for large files:"
      echo "  git lfs track '$file'"
      echo "  git add .gitattributes"
      echo "  git add '$file'"
      exit 1
    elif [ $size -gt $warn_size ]; then
      echo "⚠️  Warning: $file is larger than 1MB ($size bytes)"
    fi

    # Check prohibited file types
    extension="${file##*.}"
    for ext in $prohibited_extensions; do
      if [[ ".${extension}" == "$ext" ]]; then
        echo "❌ Binary file type $ext is not allowed: $file"
        echo "Use Git LFS or a package manager for binary dependencies"
        exit 1
      fi
    done
  fi
done
```

### Dependency and Lock File Validation

`.husky/pre-commit` (addition):

```bash
#!/usr/bin/env sh
# Ensure lock file is updated for various package managers
if git diff --cached --name-only | grep -q "package.json"; then
  # Detect package manager
  if [ -f "pnpm-lock.yaml" ]; then
    if ! git diff --cached --name-only | grep -q "pnpm-lock.yaml"; then
      echo "❌ package.json was modified but pnpm-lock.yaml was not"
      echo "Run 'pnpm install' to update the lock file"
      exit 1
    fi
  elif [ -f "yarn.lock" ]; then
    if ! git diff --cached --name-only | grep -q "yarn.lock"; then
      echo "❌ package.json was modified but yarn.lock was not"
      echo "Run 'yarn install' to update the lock file"
      exit 1
    fi
  elif [ -f "package-lock.json" ]; then
    if ! git diff --cached --name-only | grep -q "package-lock.json"; then
      echo "❌ package.json was modified but package-lock.json was not"
      echo "Run 'npm install' to update the lock file"
      exit 1
    fi
  fi
fi

# Check for package.json and tsconfig.json sync
if git diff --cached --name-only | grep -q "tsconfig.json"; then
  echo "📋 tsconfig.json modified - ensure paths are in sync with package.json"
fi
```

## Performance Optimization

### Parallel Execution with Limits

`.lintstagedrc.mjs`:

```javascript
import { cpus } from 'os';

const maxWorkers = Math.max(1, cpus().length - 1);

export default {
  '*.{ts,tsx}': files => {
    const fileGroups = [];
    const groupSize = Math.ceil(files.length / maxWorkers);

    // Group files for parallel processing
    for (let i = 0; i < files.length; i += groupSize) {
      fileGroups.push(files.slice(i, i + groupSize));
    }

    return [
      // Linting can run on all files at once
      `eslint --fix --cache --max-warnings 0 ${files.join(' ')}`,
      `prettier --write --cache ${files.join(' ')}`,
      // Type checking needs all files
      files.length > 0 ? 'tsc --noEmit --incremental' : [],
      // Tests can run in parallel groups
      ...fileGroups.map(
        group => `vitest related ${group.join(' ')} --run --reporter=dot`
      ),
    ];
  },
};
```

### Caching Strategy

`.husky/common.sh`:

```bash
#!/usr/bin/env sh

# Cache TypeScript build info
export TSC_COMPILE_ON_ERROR=true
export FORCE_COLOR=1

# ESLint cache
export ESLINT_CACHE_LOCATION=".cache/eslint"

# Prettier cache
export PRETTIER_CACHE_LOCATION=".cache/prettier"

# Jest/Vitest cache
export JEST_CACHE_DIRECTORY=".cache/jest"
export VITEST_CACHE_DIRECTORY=".cache/vitest"

# Use turbo for caching if available
if command -v turbo &> /dev/null; then
  export TURBO_CACHE_DIR=".cache/turbo"
  export TURBO_TEAM="local"
  export TURBO_TOKEN="local"
fi

# Create cache directories
mkdir -p .cache/{eslint,prettier,jest,vitest,turbo}

# Clean old cache files (older than 7 days)
find .cache -type f -mtime +7 -delete 2>/dev/null || true
```

## Troubleshooting

### Skip Hooks (Emergency Only)

```bash
# Skip pre-commit hook
git commit --no-verify -m "emergency: fix critical bug"

# Skip all hooks
HUSKY=0 git push

# Skip specific hook
HUSKY_SKIP_HOOKS=pre-push git push
```

### Debug Mode

```bash
# Enable debug output
HUSKY_DEBUG=1 git commit -m "test"

# Verbose lint-staged
npx lint-staged --debug --verbose

# Time hook execution
time git commit -m "test"
```

### Common Issues

1. **Hook not running**:

   ```bash
   # Ensure hooks are executable
   chmod +x .husky/*

   # Re-install hooks
   rm -rf .husky/_
   pnpm exec husky
   ```

2. **Performance issues**:

   ```bash
   # Profile lint-staged
   npx lint-staged --debug --verbose

   # Use cache more aggressively
   echo "*.cache" >> .gitignore

   # Run only on changed files since branch point
   npx lint-staged --diff="$(git merge-base HEAD main)...HEAD"
   ```

3. **CI conflicts**:

   ```bash
   # .husky/pre-commit
   #!/usr/bin/env sh
   . "$(dirname -- "$0")/_/husky.sh"

   # Skip in CI environments
   if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ] || [ -n "$GITLAB_CI" ]; then
     echo "Skipping git hooks in CI environment"
     exit 0
   fi

   pnpm exec lint-staged
   ```

4. **Node version mismatch**:

   ```bash
   # .husky/common.sh
   # Ensure correct Node version
   if command -v fnm &> /dev/null; then
     fnm use
   elif command -v nvm &> /dev/null; then
     nvm use
   fi
   ```

## Best Practices

1. **Keep hooks fast**:

   - Target < 10 seconds for pre-commit
   - Target < 30 seconds for pre-push
   - Use `--cache` flags where available

2. **Fail gracefully**:

   - Provide clear error messages with fix instructions
   - Show progress indicators for long operations
   - Exit early on first failure

3. **Allow bypasses**:

   - Document emergency escape hatches
   - Require justification in commit message
   - Alert team when hooks are skipped

4. **Cache aggressively**:

   - Use ESLint and Prettier caches
   - Cache TypeScript incremental builds
   - Clean caches periodically

5. **Progressive enhancement**:

   - Start with format and lint
   - Add type checking
   - Add tests gradually
   - Finally add security scans

6. **Document exceptions**:

   - Create `.husky/EMERGENCY.md`
   - Log when hooks are bypassed
   - Review bypass usage monthly

7. **Monitor performance**:

   - Add timing to each hook
   - Track trends over time
   - Optimize slowest checks first

8. **Team alignment**:
   - Include setup in onboarding
   - Automate hook installation
   - Share hook skip metrics
   - Regular hook health reviews

## Example Complete Setup

```bash
# Initial setup script
#!/usr/bin/env bash
set -e

echo "🚀 Setting up Git hooks..."

# Install dependencies
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional

# Initialize Husky
pnpm exec husky init

# Create hooks
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
. "$(dirname -- "$0")/common.sh"

pnpm exec lint-staged
EOF

cat > .husky/commit-msg << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec commitlint --edit "$1"
EOF

# Make hooks executable
chmod +x .husky/*

echo "✅ Git hooks configured successfully!"
```
