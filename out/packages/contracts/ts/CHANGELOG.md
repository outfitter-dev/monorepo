# @outfitter/contracts

## 1.1.0

### Minor Changes

- 475b9aa: Add sub-path exports for fine-grained imports and better tree-shaking

You can now import from specific modules to reduce bundle size:

```typescript
// New sub-path imports (tree-shakable)
import { makeError } from '@outfitter/contracts/error';
import { success, failure } from '@outfitter/contracts/result';
import { assert } from '@outfitter/contracts/assert';
import { createUserId } from '@outfitter/contracts/branded';
import { DeepReadonly } from '@outfitter/contracts/types';

// Existing barrel import (still works)
import { makeError, success, failure } from '@outfitter/contracts';
```

This is a non-breaking change - all existing imports continue to work. The sub-path exports enable better tree-shaking and smaller bundles for applications that only use a subset of the utilities.

Note: Sub-path exports require Node.js ≥ 18.12 or a modern bundler that supports the package.json "exports" field.

## 1.0.4

### Patch Changes

- 98a1cd3: Bump all packages to version 1.0.3 with proper publishing configuration
  - Add missing publishConfig fields for npm publishing
  - Fix repository metadata and directory paths
  - Ensure consistent versioning across monorepo
  - Clean up CHANGELOG files and git tracking
