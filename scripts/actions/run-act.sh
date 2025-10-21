#!/usr/bin/env bash
set -euo pipefail

if command -v act >/dev/null 2>&1; then
  exec act "$@"
fi

cat <<'EOF' 1>&2
act CLI is not installed.

Install options:
  - brew install act
  - or follow https://github.com/nektos/act#getting-started

Once installed, re-run this script to execute GitHub Actions locally.
EOF
exit 1
