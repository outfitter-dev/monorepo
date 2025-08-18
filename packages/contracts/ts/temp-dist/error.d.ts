import type { DeepReadonly } from './types/index';
/**

- Standard error codes for application errors
- Using const object for better type safety than enum
 */
export declare const ErrorCode: {
  readonly VALIDATION_ERROR: 'VALIDATION_ERROR';
  readonly NOT_FOUND: 'NOT_FOUND';
  readonly UNAUTHORIZED: 'UNAUTHORIZED';
  readonly FORBIDDEN: 'FORBIDDEN';
  readonly CONFLICT: 'CONFLICT';
  readonly INTERNAL_ERROR: 'INTERNAL_ERROR';
  readonly EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR';
  readonly RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED';
  readonly FILE_OPERATION_FAILED: 'FILE_OPERATION_FAILED';
  readonly MIGRATION_FAILED: 'MIGRATION_FAILED';
  readonly SETUP_FAILED: 'SETUP_FAILED';
  readonly UPDATE_FAILED: 'UPDATE_FAILED';
  readonly ADD_FAILED: 'ADD_FAILED';
  readonly REMOVE_FAILED: 'REMOVE_FAILED';
  readonly PACKAGE_MANAGER_ERROR: 'PACKAGE_MANAGER_ERROR';
  readonly PROJECT_DETECTION_FAILED: 'PROJECT_DETECTION_FAILED';
};
export type ErrorCode = [typeof ErrorCode](keyof typeof ErrorCode);
/**
- Error code categories for better organization
 */
export declare const ErrorCategory: {
  readonly VALIDATION: readonly ['VALIDATION_ERROR'];
  readonly AUTH: readonly ['UNAUTHORIZED', 'FORBIDDEN'];
  readonly RESOURCE: readonly ['NOT_FOUND', 'CONFLICT'];
  readonly SYSTEM: readonly ['INTERNAL_ERROR', 'EXTERNAL_SERVICE_ERROR'];
  readonly RATE_LIMIT: readonly ['RATE_LIMIT_EXCEEDED'];
  readonly FILE_OPERATIONS: readonly ['FILE_OPERATION_FAILED'];
  readonly MIGRATIONS: readonly ['MIGRATION_FAILED'];
  readonly SETUP_OPERATIONS: readonly [
    'SETUP_FAILED',
    'ADD_FAILED',
    'REMOVE_FAILED',
    'UPDATE_FAILED',
  ];
  readonly PACKAGE_MANAGEMENT: readonly ['PACKAGE_MANAGER_ERROR'];
  readonly PROJECT_DETECTION: readonly ['PROJECT_DETECTION_FAILED'];
};
/**
- Check if an error code belongs to a category
 */
export declare function isErrorInCategory(
  code: ErrorCode,
  category: keyof typeof ErrorCategory
): boolean;
/**
- Application error with structured metadata
 */
export interface AppError {
  readonly name: 'AppError';
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: DeepReadonly<Record<string, unknown>>;
  readonly originalError?: Error;
  readonly stack?: string;
}
/**
- Create a structured app error
 */
export declare function makeError(
  code: ErrorCode,
  message: string,
  details?: DeepReadonly<Record<string, unknown>>,
  originalError?: Error
): AppError;
/**
- Safe version of makeError that returns a Result instead of throwing
 */
export declare function tryMakeError(
  code: unknown,
  message: unknown,
  details?: unknown,
  originalError?: unknown
):
  | {
      success: true;
      data: AppError;
    }
  | {
      success: false;
      error: string;
    };
/**
- Type guard to check if error is an AppError
 */
export declare function isAppError(error: unknown): error is AppError;
/**
- Convert any error to AppError
 */
export declare function toAppError(error: unknown): AppError;
//# sourceMappingURL=error.d.ts.map
