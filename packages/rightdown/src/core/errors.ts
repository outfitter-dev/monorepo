import { ErrorCode } from '@outfitter/contracts';

/**
 * Map Rightdown-specific error scenarios to contracts error codes
 */
export const RIGHTDOWN_ERROR_CODES = {
  // Config errors
  FILE_NOT_FOUND: ErrorCode.NOT_FOUND,
  INVALID_YAML: ErrorCode.VALIDATION_ERROR,
  INVALID_CONFIG: ErrorCode.VALIDATION_ERROR,
  UNSUPPORTED_VERSION: ErrorCode.VALIDATION_ERROR,

  // Formatter errors
  FORMATTER_NOT_FOUND: ErrorCode.NOT_FOUND,
  FORMATTER_FAILED: ErrorCode.INTERNAL_ERROR,
  FORMATTER_TIMEOUT: ErrorCode.INTERNAL_ERROR,

  // AST processing errors
  PARSE_ERROR: ErrorCode.VALIDATION_ERROR,
  INVALID_MARKDOWN: ErrorCode.VALIDATION_ERROR,

  // General errors
  VALIDATION_ERROR: ErrorCode.VALIDATION_ERROR,
  IO_ERROR: ErrorCode.INTERNAL_ERROR,
  INTERNAL_ERROR: ErrorCode.INTERNAL_ERROR,
} as const;

export type RightdownErrorCode = (typeof RIGHTDOWN_ERROR_CODES)[keyof typeof RIGHTDOWN_ERROR_CODES];
