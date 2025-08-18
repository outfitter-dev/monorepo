import type { z } from 'zod';
import { type AppError } from '../index.js';
/**

- Converts a Zod validation error into a standardized application error.
-
- Transforms each issue from the Zod error into a simplified object containing the error path, message, code, and optionally the received value, and attaches them as metadata to the returned {@link AppError}.
-
- @param error - The Zod validation error to convert.
- @returns An {@link AppError} representing the validation failure, with details about each issue.
 */
export declare function fromZod(error: z.ZodError): AppError;
//# sourceMappingURL=error.d.ts.map
