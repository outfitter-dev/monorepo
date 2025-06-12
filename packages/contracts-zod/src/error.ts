import type { z } from 'zod';

import { makeError, ErrorCode, type AppError } from '@outfitter/contracts';

/**
 * Converts a Zod validation error into a standardized application error.
 *
 * Transforms each issue from the Zod error into a simplified object containing the error path, message, code, and optionally the received value, and attaches them as metadata to the returned {@link AppError}.
 *
 * @param error - The Zod validation error to convert.
 * @returns An {@link AppError} representing the validation failure, with details about each issue.
 */
export function fromZod(error: z.ZodError): AppError {
  return makeError(ErrorCode.VALIDATION_ERROR, 'Validation failed', {
    issues: error.issues.map(issue => {
      const baseIssue = {
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      } as const;

      if ('received' in issue && issue.received !== undefined) {
        return { ...baseIssue, received: issue.received };
      }

      return baseIssue;
    }),
  });
}
