# outfitter

## 1.1.0

### Minor Changes

- d132c5d: feat: add monorepo support to equip command

  - Automatically detect workspace/monorepo environments
  - Add `-w` flag for pnpm/yarn/npm when in workspace root (default behavior)
  - Add `--filter <target>` option to install to specific workspace packages
  - Add `--workspace-root` option to explicitly install to workspace root
  - Show helpful context messages when operating in monorepo mode
  - This resolves the `ERR_PNPM_ADDING_TO_ROOT` error when using outfitter in monorepos

## 1.0.4

### Patch Changes

- 98a1cd3: Bump all packages to version 1.0.3 with proper publishing configuration

  - Add missing publishConfig fields for npm publishing
  - Fix repository metadata and directory paths
  - Ensure consistent versioning across monorepo
  - Clean up CHANGELOG files and git tracking
