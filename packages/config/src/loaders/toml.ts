/**
 * TOML format loader
 *
 * Loads and parses TOML configuration files using Bun's native TOML support.
 */

import { err, ok, type Result } from "@outfitter/contracts";

/**
 * Load and parse a TOML file
 *
 * Uses Bun's native TOML loader via dynamic import.
 * Bun automatically parses .toml files when imported.
 *
 * @param path - Absolute path to the TOML file
 * @returns Result containing parsed data or error
 *
 * @example
 * ```typescript
 * const result = await loadToml('/path/to/config.toml');
 * if (result.ok) {
 *   console.log('Parsed TOML:', result.value);
 * } else {
 *   console.error('Failed to load TOML:', result.error);
 * }
 * ```
 */
export async function loadToml(path: string): Promise<Result<unknown, Error>> {
  try {
    const file = Bun.file(path);
    const exists = await file.exists();

    if (!exists) {
      return err(new Error(`TOML file not found: ${path}`));
    }

    // Bun natively supports importing TOML files
    // We use dynamic import to load and parse the TOML file
    const imported = await import(path);

    // The TOML content is typically in the default export
    const parsed = imported.default ?? imported;

    return ok(parsed);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error(`Failed to parse TOML: ${String(error)}`),
    );
  }
}
