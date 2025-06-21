# rightdown

## 1.1.0

### Minor Changes

- 95c8838: feat: add rightdown package for opinionated markdown linting

  - New package providing advanced markdown linting and formatting
  - Includes `rightdown` CLI tool
  - Three presets: strict, standard (default), and relaxed
  - Custom rules beyond markdownlint:
    - consistent-terminology: Enforce correct spelling/capitalization
  - Auto-fix support for many issues
  - Configurable via `.rightdown.config.yaml` files
  - Can be installed globally or as a dev dependency

### Patch Changes

- 2f9d3b4: fix: resolve TypeScript build errors and add comprehensive test suite

Fixed TypeScript compilation errors with index signature property access and added complete test coverage:

  - Unit tests for config generator, presets, and custom terminology rule
  - Integration tests for CLI functionality
  - Tests achieve 80%+ coverage requirement
  - All tests passing

- Updated dependencies [475b9aa]
  - @outfitter/contracts@1.1.0
