import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { ArgumentsCamelCase } from 'yargs';
import { colors } from '../utils/colors.js';
import * as yaml from 'js-yaml';
import { getPresetConfig, presets } from '../presets/index.js';
import type { PresetName, MdlintConfig } from '../types.js';

interface RulesListArgs {
  preset?: PresetName;
  quiet?: boolean;
}

interface RulesUpdateArgs {
  rules: string[];
  quiet?: boolean;
  _?: unknown[]; // Capture remaining args for rule options
  [key: string]: unknown; // Allow dynamic rule options
}

interface RulesForgetArgs {
  rules: string[];
  quiet?: boolean;
}

const CONFIG_PATH = '.markdownlint-cli2.yaml';

/**
 * Displays the list of markdownlint rules from a specified preset, the current configuration file, or the default preset.
 *
 * Groups rules by their status (enabled, configured, or disabled) and prints them to the console. If not in quiet mode, also prints instructions for updating rules.
 */
export async function rulesListCommand(argv: ArgumentsCamelCase<RulesListArgs>): Promise<void> {
  const { preset, quiet } = argv;

  try {
    let config: MdlintConfig;
    let source: string;

    if (preset) {
      // Show preset rules
      config = getPresetConfig(preset);
      source = `${preset} preset`;
    } else if (existsSync(CONFIG_PATH)) {
      // Show current config rules
      const configContent = readFileSync(CONFIG_PATH, 'utf-8');
      config = yaml.load(configContent) as MdlintConfig;
      source = 'current configuration';
    } else {
      // Show default (standard) preset
      config = getPresetConfig('standard');
      source = 'standard preset (default)';
    }

    if (!quiet) {
      console.log(colors.bold(`\nRules from ${source}:\n`));
    }

    // Group rules by status
    const enabledRules: Record<string, any> = {};
    const disabledRules: string[] = [];
    const configuredRules: Record<string, any> = {};

    Object.entries(config).forEach(([key, value]) => {
      // Only process markdown rules (MDxxx format)
      if (!key.match(/^MD\d{3}$/)) {
        return;
      }

      // Skip null/undefined values
      if (value == null) {
        return;
      }

      if (value === false) {
        disabledRules.push(key);
      } else if (value === true) {
        enabledRules[key] = true;
      } else if (typeof value === 'object') {
        configuredRules[key] = value;
      }
    });

    // Display enabled rules
    if (Object.keys(enabledRules).length > 0) {
      console.log(colors.green('Enabled:'));
      Object.keys(enabledRules)
        .sort()
        .forEach((rule) => {
          console.log(`  ${rule}`);
        });
      console.log();
    }

    // Display configured rules
    if (Object.keys(configuredRules).length > 0) {
      console.log(colors.blue('Configured:'));
      Object.entries(configuredRules)
        .sort()
        .forEach(([rule, options]) => {
          console.log(`  ${rule}:`);
          if (options && typeof options === 'object') {
            Object.entries(options).forEach(([key, value]) => {
              console.log(`    ${key}: ${JSON.stringify(value)}`);
            });
          }
        });
      console.log();
    }

    // Display disabled rules
    if (disabledRules.length > 0) {
      console.log(colors.red('Disabled:'));
      disabledRules.sort().forEach((rule) => {
        console.log(`  ${rule}`);
      });
      console.log();
    }

    if (!quiet) {
      console.log(colors.dim('Run "rightdown rules update <rule> <value>" to modify rules'));
    }
  } catch (error) {
    console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export async function rulesUpdateCommand(argv: ArgumentsCamelCase<RulesUpdateArgs>): Promise<void> {
  const { rules, quiet, _, $0, ...otherArgs } = argv;

  // Reconstruct the full args including any dynamic options
  const fullArgs: string[] = [...rules];

  // Add any additional args that were parsed as options
  Object.entries(otherArgs).forEach(([key, value]) => {
    // Skip known options and camelCase duplicates
    if (['quiet', 'q', 'verbose', 'v', 'version', 'help', 'h'].includes(key)) {
      return;
    }
    // Skip camelCase versions if kebab-case version exists
    const kebabKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    if (kebabKey !== key && otherArgs[kebabKey] !== undefined) {
      return;
    }
    // Add as --key value pairs
    fullArgs.push(`--${key}`);
    if (value !== true) {
      fullArgs.push(String(value));
    }
  });

  try {
    // Load existing config or create new one
    let config: MdlintConfig;
    if (existsSync(CONFIG_PATH)) {
      const configContent = readFileSync(CONFIG_PATH, 'utf-8');
      config = yaml.load(configContent) as MdlintConfig;
    } else {
      config = getPresetConfig('standard');
    }

    // Parse rule updates from args
    const updates = parseRuleUpdates(fullArgs);

    // Apply updates
    Object.entries(updates).forEach(([rule, value]) => {
      config[rule] = value;
    });

    // Save config
    const yamlContent = yaml.dump(config, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
      noRefs: true,
    });

    writeFileSync(CONFIG_PATH, yamlContent);

    if (!quiet) {
      console.log(colors.success('✅'), 'Rules updated successfully:');
      Object.entries(updates).forEach(([rule, value]) => {
        if (typeof value === 'object') {
          console.log(`  ${rule}:`, JSON.stringify(value));
        } else {
          console.log(`  ${rule}: ${value}`);
        }
      });
    }
  } catch (error) {
    console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Removes specified markdownlint rules from the configuration file.
 *
 * Deletes the given rules from `.markdownlint-cli2.yaml`. If no matching rules are found, prints a warning and makes no changes. Exits with an error if the configuration file does not exist.
 */
export async function rulesForgetCommand(argv: ArgumentsCamelCase<RulesForgetArgs>): Promise<void> {
  const { rules, quiet } = argv;

  try {
    if (!existsSync(CONFIG_PATH)) {
      throw new Error('No configuration file found. Run "rightdown init" first.');
    }

    // Load config
    const configContent = readFileSync(CONFIG_PATH, 'utf-8');
    const config = yaml.load(configContent) as MdlintConfig;

    // Remove specified rules
    const removed: string[] = [];
    rules.forEach((rule) => {
      const ruleKey = rule.toUpperCase();
      if (config[ruleKey] !== undefined) {
        delete config[ruleKey];
        removed.push(ruleKey);
      }
    });

    if (removed.length === 0) {
      console.log(colors.warning('No matching rules found in configuration.'));
      return;
    }

    // Save config
    const yamlContent = yaml.dump(config, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
      noRefs: true,
    });

    writeFileSync(CONFIG_PATH, yamlContent);

    if (!quiet) {
      console.log(colors.success('✅'), 'Rules removed from configuration:');
      removed.forEach((rule) => {
        console.log(`  ${rule}`);
      });
    }
  } catch (error) {
    console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Parse rule updates from command line args
// Examples:
// md003 atx -> { MD003: "atx" }
// md024 true -> { MD024: true }
// md013 --line-length 80 --tables true -> { MD013: { line_length: 80, tables: true } }
function parseRuleUpdates(args: string[]): Record<string, any> {
  const updates: Record<string, any> = {};
  let currentRule: string | null = null;
  let currentOptions: Record<string, any> = {};
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    // Check if this is a rule name (MDxxx format)
    if (arg.match(/^MD\d{3}$/i)) {
      // Save previous rule if any
      if (currentRule) {
        updates[currentRule.toUpperCase()] =
          Object.keys(currentOptions).length > 0 ? currentOptions : true;
      }

      currentRule = arg;
      currentOptions = {};
      i++;

      // Check if next arg is a simple value (not an option and not another rule)
      if (i < args.length && !args[i].startsWith('--') && !args[i].match(/^MD\d{3}$/i)) {
        const value = args[i];
        // Parse boolean or keep as string
        if (value === 'true') {
          updates[currentRule.toUpperCase()] = true;
        } else if (value === 'false') {
          updates[currentRule.toUpperCase()] = false;
        } else {
          updates[currentRule.toUpperCase()] = value;
        }
        currentRule = null;
        i++;
      }
    } else if (arg.startsWith('--') && currentRule) {
      // This is an option for the current rule
      const key = arg.slice(2).replace(/-/g, '_'); // Convert kebab-case to snake_case
      i++;

      if (i < args.length && !args[i].startsWith('--') && !args[i].match(/^MD\d{3}$/i)) {
        const value = args[i];
        // Parse value type
        if (value === 'true') {
          currentOptions[key] = true;
        } else if (value === 'false') {
          currentOptions[key] = false;
        } else if (!isNaN(Number(value))) {
          currentOptions[key] = Number(value);
        } else {
          currentOptions[key] = value;
        }
        i++;
      } else {
        // Option without value means true
        currentOptions[key] = true;
      }
    } else {
      i++;
    }
  }

  // Save last rule if any
  if (currentRule) {
    updates[currentRule.toUpperCase()] =
      Object.keys(currentOptions).length > 0 ? currentOptions : true;
  }

  return updates;
}
