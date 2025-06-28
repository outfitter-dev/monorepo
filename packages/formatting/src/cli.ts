#!/usr/bin/env node

/**
 * CLI for @outfitter/formatting
 */

import { Command } from 'commander';
import { setup } from './core/setup.js';
import { detectAvailableFormatters } from './utils/detection.js';
import { getAllPresets } from './core/presets.js';
import { validateCLISetupOptions } from './utils/validation.js';
import type { FormatterDetection } from './types/index.js';

const program = new Command();

program
  .name('outfitter-formatting')
  .description('Lightweight formatting setup tool for Prettier, Biome, ESLint, and Remark')
  .version('0.1.0');

// Setup command
program
  .command('setup')
  .description('Set up formatting configuration for your project')
  .option(
    '-p, --preset <preset>',
    'Preset to use (standard, strict, relaxed) or path to YAML preset file',
    'standard',
  )
  .option('-f, --formatters <formatters...>', 'Specific formatters to configure')
  .option('--no-scripts', 'Skip updating package.json scripts')
  .option('--install-missing', 'Attempt to install missing formatters')
  .option('--devcontainer', 'Generate devcontainer configuration')
  .option('--dry-run', 'Show what would be done without making changes')
  .option('-v, --verbose', 'Verbose output')
  .option('--target-dir <dir>', 'Target directory for setup', process.cwd())
  .action(async (options) => {
    try {
      // Validate CLI options
      const validationResult = validateCLISetupOptions(options);
      if (!validationResult.success) {
        console.error(
          '❌ Invalid options:',
          validationResult.error.errors.map((e: { message: string }) => e.message).join(', '),
        );
        process.exit(1);
      }

      console.log('🔧 Setting up formatting configuration...\n');

      const result = await setup(validationResult.data);

      if (!result.success) {
        console.error('❌ Setup failed');
        process.exit(1);
      }

      const { data: setupResult } = result;

      // Print info messages
      for (const info of setupResult.info) {
        console.log(`ℹ️  ${info}`);
      }

      // Print warnings
      for (const warning of setupResult.warnings) {
        console.log(`⚠️  ${warning}`);
      }

      // Print errors
      for (const error of setupResult.errors) {
        console.error(`❌ ${error}`);
      }

      if (setupResult.success) {
        console.log('\n✅ Formatting setup completed successfully!');

        if (setupResult.configs.length > 0) {
          console.log('\n📄 Generated configuration files:');
          for (const config of setupResult.configs) {
            console.log(`   • ${config.path}`);
          }
        }

        if (Object.keys(setupResult.scripts).length > 0) {
          console.log('\n📦 Added package.json scripts:');
          for (const [name, command] of Object.entries(setupResult.scripts)) {
            console.log(`   • ${name}: ${command}`);
          }
        }
      } else {
        console.error('\n❌ Setup completed with errors');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Setup failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Detect command
program
  .command('detect')
  .description('Detect available formatters')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    try {
      console.log('🔍 Detecting available formatters...\n');

      const result = await detectAvailableFormatters();

      if (!result.success) {
        console.error('❌ Detection failed:', result.error.message);
        process.exit(1);
      }

      const { formatters, available, missing } = result.data;

      if (available.length > 0) {
        console.log('✅ Available formatters:');
        for (const formatterType of available) {
          const formatter = formatters.find((f: FormatterDetection) => f.type === formatterType);
          if (formatter && options.verbose) {
            console.log(
              `   • ${formatter.type} (${formatter.version || 'unknown version'}) - ${formatter.location}`,
            );
            if (formatter.path) {
              console.log(`     Path: ${formatter.path}`);
            }
          } else {
            console.log(`   • ${formatterType}`);
          }
        }
      } else {
        console.log('❌ No formatters detected');
      }

      if (missing.length > 0) {
        console.log('\n⚠️  Missing formatters:');
        for (const formatterType of missing) {
          const formatter = formatters.find((f: FormatterDetection) => f.type === formatterType);
          console.log(`   • ${formatterType}${formatter?.error ? ` (${formatter.error})` : ''}`);
        }

        console.log('\n💡 To install missing formatters:');
        for (const formatterType of missing) {
          switch (formatterType) {
            case 'prettier':
              console.log('   • pnpm add -D prettier');
              break;
            case 'biome':
              console.log('   • pnpm add -D @biomejs/biome');
              break;
            case 'remark':
              console.log('   • pnpm add -D remark-cli');
              break;
            case 'eslint':
              console.log('   • pnpm add -D eslint');
              break;
          }
        }
      }
    } catch (error) {
      console.error(
        '❌ Detection failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      process.exit(1);
    }
  });

// Presets command
program
  .command('presets')
  .description('List available presets')
  .option('--yaml', 'Show YAML preset file locations')
  .action((options) => {
    console.log('📋 Available presets:\n');

    const presets = getAllPresets();
    console.log('Built-in presets:');
    for (const [name, preset] of Object.entries(presets)) {
      console.log(`\n• ${name}:`);
      console.log(`  Line width: ${preset.lineWidth}`);
      console.log(`  Indentation: ${preset.indentation.width} ${preset.indentation.style}s`);
      console.log(`  Quotes: ${preset.quotes.style} (JSX: ${preset.quotes.jsx})`);
      console.log(`  Semicolons: ${preset.semicolons}`);
      console.log(`  Trailing commas: ${preset.trailingComma}`);
    }

    if (options.yaml) {
      console.log('\n💡 You can also use custom YAML presets:');
      console.log('   • Create a .yaml file with your custom preset');
      console.log('   • Use --preset path/to/preset.yaml with the setup command');
      console.log('   • See presets/ directory for examples');
    }
  });

// Migration command
program
  .command('migrate')
  .description('Analyze ESLint config for migration to Biome')
  .option('-c, --config <path>', 'Path to ESLint config file', '.eslintrc.js')
  .option('-o, --output <path>', 'Output path for migration report')
  .action(async (options) => {
    const { analyzeEslintConfig, generateMigrationReport } = await import('./utils/migration.js');

    console.log('🔄 Analyzing ESLint configuration for Biome migration...\n');

    try {
      const analysisResult = await analyzeEslintConfig(options.config);

      if (!analysisResult.success) {
        console.error('❌ Analysis failed:', analysisResult.error.message);
        process.exit(1);
      }

      const report = generateMigrationReport(analysisResult.data);

      if (options.output) {
        const { writeFile } = await import('node:fs/promises');
        await writeFile(options.output, report, 'utf-8');
        console.log(`✅ Migration report saved to: ${options.output}`);
      } else {
        console.log(report);
      }

      console.log(
        '\n💡 Run `outfitter-formatting setup --formatters biome` to generate Biome config',
      );
    } catch (error) {
      console.error(
        '❌ Migration analysis failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
