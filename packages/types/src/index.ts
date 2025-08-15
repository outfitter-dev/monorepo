/**
 * @outfitter/types - Modern TypeScript utilities
 *
 * Combines type-fest's comprehensive utilities with domain-specific types.
 * Zero runtime dependencies.
 */

// Re-export the entire type-fest library
export * from 'type-fest';
// Core types - handle conflicts with type-fest
export type {
  ApiKey,
  Base64,
  // Branded types that don't conflict
  Brand,
  Email,
  HexColor,
  JwtToken,
  Percentage,
  Port,
  PositiveInteger,
  SemVer,
  // Web-specific types
  Slug,
  Timestamp,
  Unbrand,
  Url,
  UserId,
  Uuid,
} from './core/index.js';
export {
  brand,
  createBrandedType,
  createEmail,
  createPercentage,
  createPositiveInteger,
  createTimestamp,
  createUrl,
  // Functions that don't conflict
  createUserId,
  createUuid,
  isBase64,
  isEmail,
  isHexColor,
  isPercentage,
  isPort,
  isPositiveInteger,
  isSemVer,
  isSlug,
  isTimestamp,
  isUrl,
  isUserId,
  isUuid,
} from './core/index.js';
export * from './domains/index.js';
// Our domain-specific utilities and types
export * from './utilities/index.js';

// For conflicting types, prefer type-fest versions
// If you need the contracts versions, import from './core/branded' directly

export * as Core from './core/index.js';
export * as Domains from './domains/index.js';
// Namespace exports for organized access
export * as Utilities from './utilities/index.js';
