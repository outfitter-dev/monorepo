/**

- Modern branded types
-
- Re-exports branded types from @outfitter/contracts for single source of truth.
- Provides additional web-specific branded types not covered in contracts.
 */

// Re-export core branded types from contracts
export type {
  Brand,
  Email,
  NonEmptyString,
  NonNegativeInteger,
  Percentage,
  PositiveInteger,
  Timestamp,
  Unbrand,
  Url,
  UserId,
  Uuid,
} from '@outfitter/contracts/branded';

export {
  createBrandedType,
  createEmail,
  createNonEmptyString,
  createNonNegativeInteger,
  createPercentage,
  createPositiveInteger,
  createTimestamp,
  createUrl,
  createUserId,
  createUuid,
  isEmail,
  isPercentage,
  isPositiveInteger,
  isTimestamp,
  isUrl,
  isUserId,
  isUuid,
} from '@outfitter/contracts/branded';

// Additional web-specific branded types not in contracts
export type Slug = Brand<string, 'Slug'>;
export type HexColor = Brand<string, 'HexColor'>;
export type Base64 = Brand<string, 'Base64'>;
export type JwtToken = Brand<string, 'JwtToken'>;
export type ApiKey = Brand<string, 'ApiKey'>;
export type SemVer = Brand<string, 'SemVer'>;
export type Port = Brand<number, 'Port'>;

/**

- Type guards for additional web-specific branded types
 */
export function isSlug(value: unknown): value is Slug {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function isHexColor(value: unknown): value is HexColor {
  return (
    typeof value === 'string' &&
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)
  );
}

export function isBase64(value: unknown): value is Base64 {
  return (
    typeof value === 'string' &&
    /^[A-Za-z0-9+/]*={0,2}$/.test(value) &&
    value.length % 4 === 0
  );
}

export function isSemVer(value: unknown): value is SemVer {
  return (
    typeof value === 'string' &&
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/.test(
      value
    )
  );
}

export function isPort(value: unknown): value is Port {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 65_535
  );
}

/**

- Re-export Brand type with import for convenience
 */
import type { Brand } from '@outfitter/contracts/branded';

/**

- Utility to create custom branded types (re-exported from contracts)
 */
export { createBrandedType as brand } from '@outfitter/contracts/branded';
