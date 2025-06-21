/**
 * Path resolution utilities
 * Fixes bundled rule path issues using import.meta.url
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current file directory from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Resolve paths to bundled custom rules
 * These paths work regardless of how the package is installed
 */
export const customRulePaths = {
  consistentTerminology: join(__dirname, '../../dist/rules/consistent-terminology.js'),
} as const;

/**
 * Get the CLI path for testing
 */
export function getCliPath(): string {
  return join(__dirname, '../../dist/cli.js');
}

/**
 * Get the package root directory
 */
export function getPackageRoot(): string {
  return join(__dirname, '../..');
}

/**
 * Resolve a rule path relative to the package
 */
export function resolveRulePath(rulePath: string): string {
  if (rulePath.startsWith('./') || rulePath.startsWith('../')) {
    return join(getPackageRoot(), rulePath);
  }
  return rulePath;
}
