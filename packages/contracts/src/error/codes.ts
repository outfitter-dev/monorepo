/**
 * Error code definitions
 *
 * Comprehensive error code registry organized by category.
 * Each category occupies a numeric range of 1000 codes.
 *
 * @module error/codes
 */

/**
 * Error code registry
 *
 * Codes are organized by category in 1000-code ranges:
 * - 1000-1999: Validation errors
 * - 2000-2999: Runtime errors
 * - 3000-3999: Network errors
 * - 4000-4999: Filesystem errors
 * - 5000-5999: Configuration errors
 * - 6000-6999: Security errors
 * - 7000-7999: Timeout errors
 * - 8000-8999: Resource errors
 * - 9000-9999: Auth errors
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, type ErrorCode } from '@outfitter/contracts';
 *
 * const code: ErrorCode = ERROR_CODES.INVALID_INPUT;
 * console.log(code); // 1000
 * ```
 */
export const ERROR_CODES = {
  // ========================================
  // Validation Errors (1000-1999)
  // ========================================

  /** Invalid input provided */
  INVALID_INPUT: 1000,
  /** Schema validation failed */
  SCHEMA_VALIDATION_FAILED: 1001,
  /** Type mismatch detected */
  TYPE_MISMATCH: 1002,
  /** Constraint violation */
  CONSTRAINT_VIOLATION: 1003,
  /** Format error in input */
  FORMAT_ERROR: 1004,
  /** Required field missing */
  MISSING_REQUIRED_FIELD: 1005,
  /** Invalid field value */
  INVALID_FIELD_VALUE: 1006,
  /** Value out of range */
  VALUE_OUT_OF_RANGE: 1007,
  /** Invalid enum value */
  INVALID_ENUM_VALUE: 1008,
  /** Invalid array length */
  INVALID_ARRAY_LENGTH: 1009,
  /** Invalid object structure */
  INVALID_OBJECT_STRUCTURE: 1010,
  /** Duplicate entry detected */
  DUPLICATE_ENTRY: 1011,
  /** Circular reference detected */
  CIRCULAR_REFERENCE: 1012,
  /** Invalid reference */
  INVALID_REFERENCE: 1013,
  /** Parse error */
  PARSE_ERROR: 1014,
  /** Serialization error */
  SERIALIZATION_ERROR: 1015,
  /** Deserialization error */
  DESERIALIZATION_ERROR: 1016,
  /** Invalid JSON */
  INVALID_JSON: 1017,
  /** Invalid XML */
  INVALID_XML: 1018,
  /** Invalid YAML */
  INVALID_YAML: 1019,
  /** Invalid TOML */
  INVALID_TOML: 1020,

  // ========================================
  // Runtime Errors (2000-2999)
  // ========================================

  /** Generic runtime exception */
  RUNTIME_EXCEPTION: 2000,
  /** Hook execution failed */
  HOOK_EXECUTION_FAILED: 2001,
  /** Hook not found */
  HOOK_NOT_FOUND: 2002,
  /** Dependency missing */
  DEPENDENCY_MISSING: 2003,
  /** Module not found */
  MODULE_NOT_FOUND: 2004,
  /** Function not found */
  FUNCTION_NOT_FOUND: 2005,
  /** Method not implemented */
  METHOD_NOT_IMPLEMENTED: 2006,
  /** Operation not supported */
  OPERATION_NOT_SUPPORTED: 2007,
  /** Assertion failed */
  ASSERTION_FAILED: 2008,
  /** Invariant violation */
  INVARIANT_VIOLATION: 2009,
  /** Unreachable code reached */
  UNREACHABLE_CODE: 2010,
  /** Stack overflow */
  STACK_OVERFLOW: 2011,
  /** Division by zero */
  DIVISION_BY_ZERO: 2012,
  /** Null pointer exception */
  NULL_POINTER_EXCEPTION: 2013,
  /** Undefined behavior */
  UNDEFINED_BEHAVIOR: 2014,
  /** Concurrency violation */
  CONCURRENCY_VIOLATION: 2015,
  /** Deadlock detected */
  DEADLOCK_DETECTED: 2016,
  /** Race condition */
  RACE_CONDITION: 2017,
  /** State corruption */
  STATE_CORRUPTION: 2018,
  /** Internal error */
  INTERNAL_ERROR: 2019,
  /** Unknown error */
  UNKNOWN_ERROR: 2020,

  // ========================================
  // Network Errors (3000-3999)
  // ========================================

  /** Connection refused */
  CONNECTION_REFUSED: 3000,
  /** Connection timeout */
  CONNECTION_TIMEOUT: 3001,
  /** Host not found */
  HOST_NOT_FOUND: 3002,
  /** Connection reset */
  CONNECTION_RESET: 3003,
  /** Network unreachable */
  NETWORK_UNREACHABLE: 3004,
  /** DNS lookup failed */
  DNS_LOOKUP_FAILED: 3005,
  /** SSL/TLS error */
  SSL_ERROR: 3006,
  /** Certificate error */
  CERTIFICATE_ERROR: 3007,
  /** Protocol error */
  PROTOCOL_ERROR: 3008,
  /** Bad gateway */
  BAD_GATEWAY: 3009,
  /** Service unavailable */
  SERVICE_UNAVAILABLE: 3010,
  /** Gateway timeout */
  GATEWAY_TIMEOUT: 3011,
  /** Too many redirects */
  TOO_MANY_REDIRECTS: 3012,
  /** Request aborted */
  REQUEST_ABORTED: 3013,
  /** Response error */
  RESPONSE_ERROR: 3014,
  /** Invalid response */
  INVALID_RESPONSE: 3015,
  /** Response timeout */
  RESPONSE_TIMEOUT: 3016,
  /** Upload failed */
  UPLOAD_FAILED: 3017,
  /** Download failed */
  DOWNLOAD_FAILED: 3018,
  /** Stream error */
  STREAM_ERROR: 3019,
  /** Socket error */
  SOCKET_ERROR: 3020,

  // ========================================
  // Filesystem Errors (4000-4999)
  // ========================================

  /** File not found */
  FILE_NOT_FOUND: 4000,
  /** Permission denied */
  PERMISSION_DENIED: 4001,
  /** Disk full */
  DISK_FULL: 4002,
  /** File locked */
  FILE_LOCKED: 4003,
  /** Directory not empty */
  DIRECTORY_NOT_EMPTY: 4004,
  /** Path not found */
  PATH_NOT_FOUND: 4005,
  /** File already exists */
  FILE_ALREADY_EXISTS: 4006,
  /** Directory already exists */
  DIRECTORY_ALREADY_EXISTS: 4007,
  /** Invalid path */
  INVALID_PATH: 4008,
  /** Path too long */
  PATH_TOO_LONG: 4009,
  /** Read error */
  FILE_READ_ERROR: 4010,
  /** Write error */
  FILE_WRITE_ERROR: 4011,
  /** Delete error */
  FILE_DELETE_ERROR: 4012,
  /** Copy error */
  FILE_COPY_ERROR: 4013,
  /** Move error */
  FILE_MOVE_ERROR: 4014,
  /** Symlink error */
  SYMLINK_ERROR: 4015,
  /** Mount error */
  MOUNT_ERROR: 4016,
  /** Unmount error */
  UNMOUNT_ERROR: 4017,
  /** Filesystem error */
  FILESYSTEM_ERROR: 4018,
  /** IO error */
  IO_ERROR: 4019,
  /** Encoding error */
  ENCODING_ERROR: 4020,

  // ========================================
  // Configuration Errors (5000-5999)
  // ========================================

  /** Configuration not found */
  CONFIG_NOT_FOUND: 5000,
  /** Invalid configuration */
  CONFIG_INVALID: 5001,
  /** Configuration parse error */
  CONFIG_PARSE_ERROR: 5002,
  /** Configuration validation failed */
  CONFIG_VALIDATION_FAILED: 5003,
  /** Configuration write failed */
  CONFIG_WRITE_FAILED: 5004,
  /** Missing configuration key */
  CONFIG_KEY_MISSING: 5005,
  /** Invalid configuration value */
  CONFIG_VALUE_INVALID: 5006,
  /** Configuration conflict */
  CONFIG_CONFLICT: 5007,
  /** Configuration merge error */
  CONFIG_MERGE_ERROR: 5008,
  /** Configuration schema error */
  CONFIG_SCHEMA_ERROR: 5009,
  /** Environment variable missing */
  ENV_VAR_MISSING: 5010,
  /** Invalid environment variable */
  ENV_VAR_INVALID: 5011,
  /** Settings error */
  SETTINGS_ERROR: 5012,
  /** Preferences error */
  PREFERENCES_ERROR: 5013,
  /** Registry error */
  REGISTRY_ERROR: 5014,
  /** Initialization error */
  INITIALIZATION_ERROR: 5015,
  /** Setup error */
  SETUP_ERROR: 5016,
  /** Migration error */
  MIGRATION_ERROR: 5017,
  /** Version mismatch */
  VERSION_MISMATCH: 5018,
  /** Compatibility error */
  COMPATIBILITY_ERROR: 5019,
  /** Feature not enabled */
  FEATURE_NOT_ENABLED: 5020,

  // ========================================
  // Security Errors (6000-6999)
  // ========================================

  /** Unauthorized access */
  UNAUTHORIZED_ACCESS: 6000,
  /** Forbidden operation */
  FORBIDDEN_OPERATION: 6001,
  /** Invalid credentials */
  INVALID_CREDENTIALS: 6002,
  /** Token expired */
  TOKEN_EXPIRED: 6003,
  /** Security violation */
  SECURITY_VIOLATION: 6004,
  /** Injection attempt detected */
  INJECTION_ATTEMPT: 6005,
  /** Invalid token */
  INVALID_TOKEN: 6006,
  /** Token revoked */
  TOKEN_REVOKED: 6007,
  /** Insufficient permissions */
  INSUFFICIENT_PERMISSIONS: 6008,
  /** Access denied */
  ACCESS_DENIED: 6009,
  /** Encryption error */
  ENCRYPTION_ERROR: 6010,
  /** Decryption error */
  DECRYPTION_ERROR: 6011,
  /** Signature verification failed */
  SIGNATURE_VERIFICATION_FAILED: 6012,
  /** Hash mismatch */
  HASH_MISMATCH: 6013,
  /** Tampering detected */
  TAMPERING_DETECTED: 6014,
  /** CSRF violation */
  CSRF_VIOLATION: 6015,
  /** XSS attempt */
  XSS_ATTEMPT: 6016,
  /** SQL injection attempt */
  SQL_INJECTION_ATTEMPT: 6017,
  /** Command injection attempt */
  COMMAND_INJECTION_ATTEMPT: 6018,
  /** Path traversal attempt */
  PATH_TRAVERSAL_ATTEMPT: 6019,
  /** Rate limit exceeded */
  RATE_LIMIT_EXCEEDED: 6020,

  // ========================================
  // Timeout Errors (7000-7999)
  // ========================================

  /** Operation timeout */
  OPERATION_TIMEOUT: 7000,
  /** Request timeout */
  REQUEST_TIMEOUT: 7001,
  /** Deadline exceeded */
  DEADLINE_EXCEEDED: 7002,
  /** Hook timeout */
  HOOK_TIMEOUT: 7003,
  /** Query timeout */
  QUERY_TIMEOUT: 7004,
  /** Transaction timeout */
  TRANSACTION_TIMEOUT: 7005,
  /** Lock timeout */
  LOCK_TIMEOUT: 7006,
  /** Wait timeout */
  WAIT_TIMEOUT: 7007,
  /** Idle timeout */
  IDLE_TIMEOUT: 7008,
  /** Connection idle timeout */
  CONNECTION_IDLE_TIMEOUT: 7009,
  /** Read timeout */
  READ_TIMEOUT: 7010,
  /** Write timeout */
  WRITE_TIMEOUT: 7011,
  /** Execution timeout */
  EXECUTION_TIMEOUT: 7012,
  /** Processing timeout */
  PROCESSING_TIMEOUT: 7013,
  /** Response deadline exceeded */
  RESPONSE_DEADLINE_EXCEEDED: 7014,
  /** Keepalive timeout */
  KEEPALIVE_TIMEOUT: 7015,
  /** Handshake timeout */
  HANDSHAKE_TIMEOUT: 7016,
  /** Negotiation timeout */
  NEGOTIATION_TIMEOUT: 7017,
  /** Startup timeout */
  STARTUP_TIMEOUT: 7018,
  /** Shutdown timeout */
  SHUTDOWN_TIMEOUT: 7019,
  /** Graceful shutdown timeout */
  GRACEFUL_SHUTDOWN_TIMEOUT: 7020,

  // ========================================
  // Resource Errors (8000-8999)
  // ========================================

  /** Out of memory */
  OUT_OF_MEMORY: 8000,
  /** CPU limit exceeded */
  CPU_LIMIT_EXCEEDED: 8001,
  /** Disk quota exceeded */
  DISK_QUOTA_EXCEEDED: 8002,
  /** Too many open files */
  TOO_MANY_OPEN_FILES: 8003,
  /** Resource unavailable */
  RESOURCE_UNAVAILABLE: 8004,
  /** Pool exhausted */
  POOL_EXHAUSTED: 8005,
  /** Connection pool exhausted */
  CONNECTION_POOL_EXHAUSTED: 8006,
  /** Thread pool exhausted */
  THREAD_POOL_EXHAUSTED: 8007,
  /** Buffer overflow */
  BUFFER_OVERFLOW: 8008,
  /** Queue full */
  QUEUE_FULL: 8009,
  /** Cache full */
  CACHE_FULL: 8010,
  /** Storage full */
  STORAGE_FULL: 8011,
  /** Bandwidth exceeded */
  BANDWIDTH_EXCEEDED: 8012,
  /** Quota exceeded */
  QUOTA_EXCEEDED: 8013,
  /** Limit exceeded */
  LIMIT_EXCEEDED: 8014,
  /** Capacity exceeded */
  CAPACITY_EXCEEDED: 8015,
  /** Resource conflict */
  RESOURCE_CONFLICT: 8016,
  /** Resource locked */
  RESOURCE_LOCKED: 8017,
  /** Resource busy */
  RESOURCE_BUSY: 8018,
  /** Resource exhausted */
  RESOURCE_EXHAUSTED: 8019,
  /** Allocation failed */
  ALLOCATION_FAILED: 8020,

  // ========================================
  // Auth Errors (9000-9999)
  // ========================================

  /** Authentication failed */
  AUTHENTICATION_FAILED: 9000,
  /** Authorization failed */
  AUTHORIZATION_FAILED: 9001,
  /** Session expired */
  SESSION_EXPIRED: 9002,
  /** Invalid session */
  INVALID_SESSION: 9003,
  /** Session not found */
  SESSION_NOT_FOUND: 9004,
  /** User not found */
  USER_NOT_FOUND: 9005,
  /** User not authenticated */
  USER_NOT_AUTHENTICATED: 9006,
  /** User not authorized */
  USER_NOT_AUTHORIZED: 9007,
  /** Invalid username */
  INVALID_USERNAME: 9008,
  /** Invalid password */
  INVALID_PASSWORD: 9009,
  /** Password expired */
  PASSWORD_EXPIRED: 9010,
  /** Account locked */
  ACCOUNT_LOCKED: 9011,
  /** Account disabled */
  ACCOUNT_DISABLED: 9012,
  /** Account expired */
  ACCOUNT_EXPIRED: 9013,
  /** Account not verified */
  ACCOUNT_NOT_VERIFIED: 9014,
  /** Invalid API key */
  INVALID_API_KEY: 9015,
  /** API key expired */
  API_KEY_EXPIRED: 9016,
  /** API key revoked */
  API_KEY_REVOKED: 9017,
  /** OAuth error */
  OAUTH_ERROR: 9018,
  /** SSO error */
  SSO_ERROR: 9019,
  /** MFA required */
  MFA_REQUIRED: 9020,
} as const;

/**
 * Error code type - inferred from ERROR_CODES values
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, type ErrorCode } from '@outfitter/contracts';
 *
 * function handleError(code: ErrorCode): void {
 *   if (code === ERROR_CODES.INVALID_INPUT) {
 *     console.log('Invalid input provided');
 *   }
 * }
 * ```
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Get the category range for an error code
 *
 * @param code - Error code to check
 * @returns The category range (1000, 2000, etc.)
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, getCodeCategory } from '@outfitter/contracts';
 *
 * const range = getCodeCategory(ERROR_CODES.INVALID_INPUT);
 * console.log(range); // 1000
 * ```
 */
export const getCodeCategory = (code: number): number => {
  return Math.floor(code / 1000) * 1000;
};

/**
 * Check if a code is in a specific category range
 *
 * @param code - Error code to check
 * @param categoryBase - Base of the category (1000, 2000, etc.)
 * @returns True if code is in the category range
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, isInCategory } from '@outfitter/contracts';
 *
 * const isValidation = isInCategory(ERROR_CODES.INVALID_INPUT, 1000);
 * console.log(isValidation); // true
 * ```
 */
export const isInCategory = (code: number, categoryBase: number): boolean => {
  return getCodeCategory(code) === categoryBase;
};

/**
 * Type guard to check if a number is a valid ErrorCode
 *
 * @param code - Number to check
 * @returns True if code is within the valid ErrorCode range
 */
export const isErrorCode = (code: number): code is ErrorCode => {
  return code >= 1000 && code <= 9999 && Number.isInteger(code);
};
