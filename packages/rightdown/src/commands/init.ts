import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ArgumentsCamelCase } from 'yargs';
import { colors } from '../utils/colors.js';
import * as yaml from 'js-yaml';
import type { RightdownConfig } from '../core/types.js';

interface InitCommandArgs {
  preset?: 'strict' | 'standard' | 'relaxed';
  force?: boolean;
  quiet?: boolean;
}

export async function initCommand(argv: ArgumentsCamelCase<InitCommandArgs>): Promise<void> {
  const { preset = 'standard', force = false, quiet = false } = argv;
  const configPath = resolve(process.cwd(), '.rightdown.config.yaml');

  try {
    // Check if config already exists
    if (existsSync(configPath) && !force) {
      throw new Error('Configuration file already exists. Use --force to overwrite.');
    }

    // Create default config
    const config: RightdownConfig = {
      version: 2,
      preset,
      formatters: {
        default: 'prettier',
        languages: {
          javascript: 'biome',
          typescript: 'biome',
          jsx: 'biome',
          tsx: 'biome',
          json: 'biome',
          jsonc: 'biome',
        },
      },
      ignores: [
        'node_modules/**',
        'dist/**',
        'build/**',
        'coverage/**',
        '.git/**',
        '*.min.js',
        '*.min.css',
      ],
    };

    // Add example formatter options based on preset
    if (preset === 'strict') {
      config.rules = {
        'line-length': 80,
        'code-block-style': 'fenced',
      };
      config.formatterOptions = {
        prettier: {
          printWidth: 80,
          proseWrap: 'always',
        },
        biome: {
          lineWidth: 80,
          indentStyle: 'space',
          indentWidth: 2,
        },
      };
    } else if (preset === 'relaxed') {
      config.rules = {
        'line-length': false,
      };
      config.formatterOptions = {
        prettier: {
          printWidth: 120,
          proseWrap: 'preserve',
        },
        biome: {
          lineWidth: 120,
        },
      };
    }

    // Write config file
    const yamlContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 80,
      quotingType: '"',
      forceQuotes: false,
    });

    writeFileSync(configPath, yamlContent);

    if (!quiet) {
      console.log(colors.success(`✅ Created ${configPath}`));
      console.log();
      console.log('Configuration created with:');
      console.log(`  • Preset: ${colors.info(preset)}`);
      console.log(`  • Default formatter: ${colors.info('prettier')}`);
      console.log(`  • JavaScript/TypeScript formatter: ${colors.info('biome')}`);
      console.log();
      console.log('Next steps:');
      console.log('  1. Install peer dependencies:');
      console.log(`     ${colors.dim('pnpm add -D prettier @biomejs/biome')}`);
      console.log('  2. Format your markdown files:');
      console.log(`     ${colors.dim('rightdown --write')}`);
    }
  } catch (error) {
    console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
