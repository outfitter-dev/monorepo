---
"outfitter": minor
"@outfitter/contracts": patch
"@outfitter/changeset-config": patch
---

feat(cli): add terrain detection and comprehensive improvements

### Minor Changes - outfitter

- Added terrain detection system to automatically identify project frameworks, languages, and tools
- Enhanced fieldguides commands with terrain-aware functionality
- Improved configuration applier with better error handling and interactive prompts
- Fixed Prettier configuration to use .prettierrc.cjs with proper CommonJS exports
- Added lint script to package.json for better developer experience

### Patch Changes - @outfitter/contracts

- Fixed humanize.test.ts to pass Error objects correctly to formatForDevelopers
- Improved type safety in error handling

### Patch Changes - @outfitter/changeset-config

- Updated ChangesetConfig interface to support false and tuple types for changelog field
- Added support for more flexible changelog configurations
EOF < /dev/null