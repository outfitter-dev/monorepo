#!/usr/bin/env bash
set -euo pipefail

if [ ! -d ".github/workflows" ]; then
  printf 'actionlint skipped: no workflows found at .github/workflows\n' >&2
  exit 0
fi

if command -v actionlint >/dev/null 2>&1; then
  exec actionlint "$@"
fi

if command -v docker >/dev/null 2>&1; then
  exec docker run --rm -v "$PWD":/repo -w /repo ghcr.io/rhysd/actionlint:latest "$@"
fi

cat <<'EOF' 1>&2
actionlint is not installed and Docker is unavailable.

Install options:
  - brew install actionlint
  - or download from https://github.com/rhysd/actionlint/releases
  - or install Docker to run the official actionlint container
EOF
exit 1
