// Outbound public surface of the `@outfitter/contracts` package.
//
// NOTE: When using the `NodeNext` module resolution strategy, TypeScript applies
// Node.js ESM "package exports" rules during type-checking.  One subtle
// consequence is that `export * from './file'` star re-exports originating from
// inside the package are not always visible to *external* consumers unless the
// referenced file is itself part of the `exports` map in `package.json` *or*
// the symbols are re-exported explicitly here.
//
// In practice this meant consumers such as the `@outfitter/cli` package were
// unable to `import { Result, success, failure, AppError, makeError } from
// '@outfitter/contracts'`, even though those symbols are defined in the
// internal modules.  The wildcard re-exports below compile fine, but the
// symbols disappear when TypeScript resolves the package from the outside
// because they come from private, non-exported modules.
//
// To retain the convenience of wildcard re-exports for *internal* use while
// also guaranteeing that the most commonly used public contracts remain
// available to downstream packages, we:
//   1. Keep the existing `export *` statements (these are handy when working
//      inside this package), **and**
//   2. Add explicit named re-exports for the public API surface that external
//      packages rely on.
//
// The explicit re-exports act as a shim that makes the symbols visible to
// TypeScript’s module loader regardless of the package-exports mechanics.

// Wild-card re-exports for local development -------------------------------------------------
export *from './assert.js';
export* from './error.js';
export *from './errors/index.js';
export* from './result.js';
export * from './types/index.js';

// Namespace re-export (retained for convenience) --------------------------------------------
export * as Types from './types/index.js';

// Explicit public re-exports ---------------------------------------------------------------

// Error helpers
export {
  type AppError,
  isAppError,
  isErrorInCategory,
  makeError,
  toAppError,
  tryMakeError,
} from './error.js';
// Result pattern – core helpers
export {
  all,
  type Failure,
  failure,
  flatMap,
  flatten,
  fromNullable,
  getOrElse,
  getOrElseWith,
  isFailure,
  isSuccess,
  map,
  mapError,
  match,
  type Result,
  type Success,
  success,
  tap,
  tapError,
  toPromise,
  tryAsync,
  trySync,
  unwrap,
  unwrapError,
  unwrapOr,
} from './result.js';
