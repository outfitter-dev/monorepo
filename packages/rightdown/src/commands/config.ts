import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { ArgumentsCamelCase } from 'yargs';
import { colors } from '../utils/colors.js';
import * as yaml from 'js-yaml';
import { getPresetConfig } from '../presets/index.js';
import type { PresetName, MdlintConfig } from '../types.js';

interface ConfigPresetArgs {
  name: PresetName;
  quiet?: boolean;
}

interface ConfigIgnoreArgs {
  patterns: string[];
  remove?: boolean;
  quiet?: boolean;
}

const CONFIG_PATH = '.markdownlint-cli2.yaml';

/**
 * Updates the markdownlint CLI configuration file to use the specified preset, preserving any existing custom rules, terminology, and ignore patterns.
 *
 * If a configuration file already exists, customizations such as `customRules`, `terminology`, and `ignores` are retained and merged with the selected preset. The updated configuration is saved to `.markdownlint-cli2.yaml` with a header comment indicating the preset used.
 *
 * @param argv - Command-line arguments specifying the preset name and optional quiet mode
 */
export async function configPresetCommand(
  argv: ArgumentsCamelCase<ConfigPresetArgs>,
): Promise<void> {
  const { name, quiet } = argv;

  try {
    // Get the preset config
    const presetConfig = getPresetConfig(name);

    // If config exists, preserve custom rules and ignores
    let customRules: string[] = [];
    let ignores: string[] = [];
    let terminology: Array<{ incorrect: string; correct: string }> = [];

    if (existsSync(CONFIG_PATH)) {
      const existingContent = readFileSync(CONFIG_PATH, 'utf-8');
      const existingConfig = yaml.load(existingContent) as MdlintConfig;

      // Preserve customizations
      if (existingConfig.customRules) {
        customRules = existingConfig.customRules;
      }
      if (existingConfig.ignores) {
        ignores = existingConfig.ignores;
      }
      if (existingConfig.terminology) {
        terminology = existingConfig.terminology;
      }
    }

    // Merge preset with preserved customizations
    const newConfig: MdlintConfig = {
      ...presetConfig,
      ...(customRules.length > 0 && { customRules }),
      ...(terminology.length > 0 && { terminology }),
      ...(ignores.length > 0 && { ignores }),
    };

    // Save config
    const yamlContent = yaml.dump(newConfig, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
      noRefs: true,
    });

    // Add header comment
    const finalContent = `# rightdown configuration
# Generated with preset: ${name}
# Docs: https://github.com/DavidAnson/markdownlint-cli2

${yamlContent}`;

    writeFileSync(CONFIG_PATH, finalContent);

    if (!quiet) {
      console.log(colors.success('✅'), `Configuration updated to ${name} preset`);
      if (customRules.length > 0 || ignores.length > 0 || terminology.length > 0) {
        console.log(colors.dim('  (preserved custom rules, terminology, and ignore patterns)'));
      }
    }
  } catch (error) {
    console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export async function configIgnoreCommand(
  argv: ArgumentsCamelCase<ConfigIgnoreArgs>,
): Promise<void> {
  const { patterns, remove, quiet } = argv;

  try {
    // Load existing config or create new one
    let config: MdlintConfig;
    if (existsSync(CONFIG_PATH)) {
      const configContent = readFileSync(CONFIG_PATH, 'utf-8');
      config = yaml.load(configContent) as MdlintConfig;
    } else {
      config = getPresetConfig('standard');
    }

    // Initialize ignores array if not present
    if (!config.ignores) {
      config.ignores = [];
    }

    let message: string;
    if (remove) {
      // Remove patterns
      const before = config.ignores.length;
      config.ignores = config.ignores.filter((pattern) => !patterns.includes(pattern));
      const removed = before - config.ignores.length;
      message = `Removed ${removed} ignore pattern(s)`;
    } else {
      // Add patterns (avoid duplicates)
      const newPatterns = patterns.filter((pattern) => !config.ignores!.includes(pattern));
      config.ignores.push(...newPatterns);
      message = `Added ${newPatterns.length} ignore pattern(s)`;
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
      console.log(colors.success('✅'), message);
      if (!remove && patterns.length > 0) {
        console.log(colors.dim('\nCurrent ignore patterns:'));
        config.ignores!.forEach((pattern) => {
          console.log(colors.dim(`  - ${pattern}`));
        });
      }
    }
  } catch (error) {
    console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
