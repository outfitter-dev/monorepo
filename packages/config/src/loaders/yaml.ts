/**
 * YAML format loader
 *
 * Loads and parses YAML configuration files using Bun's native YAML parser.
 */

import { err, ok, type Result } from "@outfitter/contracts";

/**
 * Load and parse a YAML file
 *
 * @param path - Absolute path to the YAML file
 * @returns Result containing parsed data or error
 *
 * @example
 * ```typescript
 * const result = await loadYaml('/path/to/config.yaml');
 * if (result.ok) {
 *   console.log('Parsed YAML:', result.value);
 * } else {
 *   console.error('Failed to load YAML:', result.error);
 * }
 * ```
 */
export async function loadYaml(path: string): Promise<Result<unknown, Error>> {
  try {
    const file = Bun.file(path);
    const exists = await file.exists();

    if (!exists) {
      return err(new Error(`YAML file not found: ${path}`));
    }

    const text = await file.text();

    // Use Bun's native YAML parser
    const parsed = Bun.YAML.parse(text);

    return ok(parsed);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error(`Failed to parse YAML: ${String(error)}`),
    );
  }
}
