/**
 * JSONC (JSON with Comments) format loader
 *
 * Loads and parses JSONC configuration files using strip-json-comments.
 */

import { err, ok, type Result } from "@outfitter/contracts";
import stripJsonComments from "strip-json-comments";

/**
 * Load and parse a JSONC file
 *
 * @param path - Absolute path to the JSONC file
 * @returns Result containing parsed data or error
 *
 * @example
 * ```typescript
 * const result = await loadJsonc('/path/to/config.jsonc');
 * if (result.ok) {
 *   console.log('Parsed JSONC:', result.value);
 * } else {
 *   console.error('Failed to load JSONC:', result.error);
 * }
 * ```
 */
export async function loadJsonc(path: string): Promise<Result<unknown, Error>> {
  try {
    const file = Bun.file(path);
    const exists = await file.exists();

    if (!exists) {
      return err(new Error(`JSONC file not found: ${path}`));
    }

    const text = await file.text();

    // Strip comments and parse as JSON
    const stripped = stripJsonComments(text);
    const parsed = JSON.parse(stripped);

    return ok(parsed);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error(`Failed to parse JSONC: ${String(error)}`),
    );
  }
}
