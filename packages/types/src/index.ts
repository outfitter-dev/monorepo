/**
 * @outfitter/types - Comprehensive TypeScript utilities combining type-fest with domain-specific types
 * @module
 */

// Re-export all type-fest utilities
export type * from "type-fest";
// Advanced type utilities
export type {
  DeepGet,
  DeepKeys,
  DiscriminatedUnion,
  DiscriminatorValues,
  EnvVarPattern,
  ExtractRouteParams,
  Interpolate,
  Switch,
} from "./advanced.js";
export * as Advanced from "./advanced.js";
// Configuration types
export type {
  ConfigFormat,
  ConfigScope,
  ConfigValidation,
  ConfigWithMetadata,
  LayeredConfig,
  MergedConfig,
} from "./config.js";
// Namespace exports for organized access
export * as Config from "./config.js";
// Maybe utilities
export type { Maybe, Nullable, Optional } from "./maybe.js";
export {
  chainMaybe,
  filterMaybe,
  getOrElse,
  getOrElseLazy,
  isDefined,
  isNull,
  isNullish,
  isUndefined,
  mapMaybe,
  nullToUndefined,
  undefinedToNull,
} from "./maybe.js";
