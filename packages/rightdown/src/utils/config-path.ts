import { existsSync } from 'node:fs';

// Configuration file names in order of preference
const DEFAULT_CONFIG_NAMES = ['.rightdown.config.yaml', '.markdownlint-cli2.yaml'];

/**
 * Get the configuration file path. Checks for existing config files in order of preference,
 * or uses the first default if none exist.
 *
 * Priority order:
 * 1. RIGHTDOWN_CONFIG environment variable
 * 2. Existing .rightdown.config.yaml file
 * 3. Existing .markdownlint-cli2.yaml file (for backward compatibility)
 * 4. Default to .rightdown.config.yaml for new files
 */
export function getConfigPath(): string {
  // Check environment variable first
  const envPath = process.env.RIGHTDOWN_CONFIG;
  if (envPath) {
    return envPath;
  }

  // Check for existing config files
  for (const configName of DEFAULT_CONFIG_NAMES) {
    if (existsSync(configName)) {
      return configName;
    }
  }

  // Default to rightdown config name for new files
  return DEFAULT_CONFIG_NAMES[0];
}

/**
 * Get all possible config file names for checking existence
 */
export function getConfigNames(): Array<string> {
  return DEFAULT_CONFIG_NAMES;
}

// All config file names that markdownlint-cli2 supports
const ALL_SUPPORTED_CONFIGS = [
  '.rightdown.config.yaml',
  '.markdownlint-cli2.yaml',
  '.markdownlint-cli2.jsonc',
  '.markdownlint-cli2.json',
  '.markdownlint.yaml',
  '.markdownlint.json',
];

/**
 * Check if any supported configuration file exists.
 * This includes all formats that markdownlint-cli2 can read.
 */
export function hasAnyConfigFile(): boolean {
  // Check environment variable first
  if (process.env.RIGHTDOWN_CONFIG) {
    return true;
  }

  // Check for any supported config file
  return ALL_SUPPORTED_CONFIGS.some((configName) => existsSync(configName));
}
