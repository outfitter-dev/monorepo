# !/bin/bash

# Install Husky and lint-staged

npm install --save-dev husky lint-staged

# Initialize Husky

npx husky init

# Create pre-commit hook

cat > .husky/pre-commit << 'EOF'

# !/usr/bin/env sh

. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged

npx lint-staged

# Run tests for changed files

npm run test:related
EOF

# Create pre-push hook

cat > .husky/pre-push << 'EOF'

# !/usr/bin/env sh

. "$(dirname -- "$0")/_/husky.sh"

# Run all tests before push

npm run test

# Check types

npm run typecheck

# Check linting

npm run lint
EOF

# Make hooks executable

chmod +x .husky/pre-commit
chmod +x .husky/pre-push

# Add lint-staged configuration to package.json

# (This would normally be done programmatically)

echo "Add this to your package.json:"
echo '
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ],
    "*.test.{ts,tsx,js,jsx}": [
      "vitest related --run"
    ]
  }
}'
