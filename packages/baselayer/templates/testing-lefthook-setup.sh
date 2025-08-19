#!/bin/bash

# Install Lefthook

npm install --save-dev lefthook

# Create lefthook.yml configuration

cat > lefthook.yml << 'EOF'

# Lefthook configuration

# https://github.com/evilmartians/lefthook

pre-commit:
  parallel: true
  commands:
    lint-staged:
      glob: "*.{ts,tsx,js,jsx,json,md,yml,yaml}"
      run: npx lint-staged
    tests:
      glob: "*.{test,spec}.{ts,tsx,js,jsx}"
      run: npm run test:related -- {staged_files}

pre-push:
  parallel: false
  commands:
    tests:
      run: npm run test
    typecheck:
      run: npm run typecheck
    lint:
      run: npm run lint

commit-msg:
  commands:
    commitlint:
      run: npx commitlint --edit {1}

# Skip hooks in CI

skip:

- ci: test
- rebase: true
- merge: true
EOF

# Install Lefthook git hooks

npx lefthook install

# Add lint-staged configuration to package.json

# (This would normally be done programmatically)

echo "Add this to your package.json:"
echo '
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "npm run format --no-errors-on-unmatched",
      "npm run lint --no-errors-on-unmatched"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ],
    "*.test.{ts,tsx,js,jsx}": [
      "vitest related --run"
    ]
  }
}'

# Verify installation

echo ""
echo "✅ Lefthook installed successfully!"
echo "Run 'npx lefthook run pre-commit' to test pre-commit hooks"
