/**
 * Error category definitions
 *
 * Maps error codes to categories and provides severity mappings.
 *
 * @module error/categories
 */

import { getCodeCategory } from "./codes.js";

/**
 * Error category enum
 *
 * Categories organize errors by domain for systematic classification
 * and handling. Each category maps to a specific numeric code range.
 *
 * @example
 * ```typescript
 * import { ErrorCategory } from '@outfitter/contracts';
 *
 * function handleError(category: ErrorCategory): void {
 *   if (category === 'VALIDATION') {
 *     console.log('Validation error occurred');
 *   }
 * }
 * ```
 */
export type ErrorCategory =
  | "VALIDATION"
  | "RUNTIME"
  | "NETWORK"
  | "FILESYSTEM"
  | "CONFIGURATION"
  | "SECURITY"
  | "TIMEOUT"
  | "RESOURCE"
  | "AUTH";

/**
 * Error severity levels
 *
 * Indicates the impact and urgency of an error.
 *
 * @example
 * ```typescript
 * import { ErrorSeverity } from '@outfitter/contracts';
 *
 * function logError(severity: ErrorSeverity, message: string): void {
 *   if (severity === 'CRITICAL') {
 *     console.error('CRITICAL:', message);
 *   }
 * }
 * ```
 */
export type ErrorSeverity = "CRITICAL" | "ERROR" | "WARNING" | "INFO";

/**
 * Category to code range mapping
 *
 * Maps each category to its numeric range base (1000, 2000, etc.)
 */
const CATEGORY_RANGES: Record<ErrorCategory, number> = {
  AUTH: 9000,
  CONFIGURATION: 5000,
  FILESYSTEM: 4000,
  NETWORK: 3000,
  RESOURCE: 8000,
  RUNTIME: 2000,
  SECURITY: 6000,
  TIMEOUT: 7000,
  VALIDATION: 1000,
};

/**
 * Default severity for each category
 *
 * Maps categories to their default severity levels.
 */
const CATEGORY_SEVERITIES: Record<ErrorCategory, ErrorSeverity> = {
  AUTH: "ERROR",
  CONFIGURATION: "ERROR",
  FILESYSTEM: "ERROR",
  NETWORK: "ERROR",
  RESOURCE: "ERROR",
  RUNTIME: "ERROR",
  SECURITY: "CRITICAL",
  TIMEOUT: "WARNING",
  VALIDATION: "WARNING",
};

/**
 * Categorize an error code
 *
 * Maps an error code to its corresponding category based on
 * the numeric range (1000s = VALIDATION, 2000s = RUNTIME, etc.)
 *
 * @param code - Error code to categorize
 * @returns The error category
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, categorizeError } from '@outfitter/contracts';
 *
 * const category = categorizeError(ERROR_CODES.INVALID_INPUT);
 * console.log(category); // 'VALIDATION'
 *
 * const category2 = categorizeError(ERROR_CODES.CONNECTION_REFUSED);
 * console.log(category2); // 'NETWORK'
 * ```
 */
export const categorizeError = (code: number): ErrorCategory => {
  const range = getCodeCategory(code);

  // Find the category that matches this range
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  for (const [category, categoryRange] of Object.entries(CATEGORY_RANGES) as Array<
    [ErrorCategory, number]
  >) {
    if (range === categoryRange) {
      return category;
    }
  }

  // Default to RUNTIME for unknown codes
  return "RUNTIME";
};

/**
 * Get default severity for a category
 *
 * Returns the default severity level associated with an error category.
 * Categories like SECURITY default to CRITICAL, while VALIDATION defaults
 * to WARNING.
 *
 * @param category - Error category
 * @returns Default severity level
 *
 * @example
 * ```typescript
 * import { getSeverity } from '@outfitter/contracts';
 *
 * const severity = getSeverity('SECURITY');
 * console.log(severity); // 'CRITICAL'
 *
 * const severity2 = getSeverity('VALIDATION');
 * console.log(severity2); // 'WARNING'
 * ```
 */
export const getSeverity = (category: ErrorCategory): ErrorSeverity => {
  return CATEGORY_SEVERITIES[category];
};

/**
 * Get severity for an error code
 *
 * Convenience function that categorizes a code and returns its
 * default severity in one step.
 *
 * @param code - Error code
 * @returns Default severity level
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, getSeverityForCode } from '@outfitter/contracts';
 *
 * const severity = getSeverityForCode(ERROR_CODES.SECURITY_VIOLATION);
 * console.log(severity); // 'CRITICAL'
 * ```
 */
export const getSeverityForCode = (code: number): ErrorSeverity => {
  const category = categorizeError(code);
  return getSeverity(category);
};

/**
 * Check if a category represents a critical issue
 *
 * @param category - Error category to check
 * @returns True if the category is critical
 *
 * @example
 * ```typescript
 * import { isCriticalCategory } from '@outfitter/contracts';
 *
 * const critical = isCriticalCategory('SECURITY');
 * console.log(critical); // true
 *
 * const notCritical = isCriticalCategory('VALIDATION');
 * console.log(notCritical); // false
 * ```
 */
export const isCriticalCategory = (category: ErrorCategory): boolean => {
  return getSeverity(category) === "CRITICAL";
};

/**
 * Get all categories with a specific severity
 *
 * @param severity - Severity level to filter by
 * @returns Array of categories with that severity
 *
 * @example
 * ```typescript
 * import { getCategoriesBySeverity } from '@outfitter/contracts';
 *
 * const critical = getCategoriesBySeverity('CRITICAL');
 * console.log(critical); // ['SECURITY']
 *
 * const warnings = getCategoriesBySeverity('WARNING');
 * console.log(warnings); // ['VALIDATION', 'TIMEOUT']
 * ```
 */
export const getCategoriesBySeverity = (severity: ErrorSeverity): ErrorCategory[] => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return (Object.entries(CATEGORY_SEVERITIES) as Array<[ErrorCategory, ErrorSeverity]>)
    .filter(([, sev]) => sev === severity)
    .map(([cat]) => cat);
};
