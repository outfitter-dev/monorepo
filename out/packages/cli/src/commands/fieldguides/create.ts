import chalk from 'chalk';
import fsExtra from 'fs-extra';
import inquirer from 'inquirer';
import ora from 'ora';

const { ensureDir, writeJSON, pathExists } = fsExtra;

import { join } from 'node:path';

interface CreateOptions {
  preset?: string;
  withClaude?: boolean;
  force?: boolean;
}

interface InquirerAnswers {
  preset: string;
}

const presets = {
  nextjs: [
    'typescript-standards',
    'react-patterns',
    'nextjs-patterns',
    'testing-standards',
  ],
  react: ['typescript-standards', 'react-patterns', 'testing-standards'],
  node: ['typescript-standards', 'testing-standards', 'security-standards'],
  minimal: ['typescript-standards'],
};

/**
 * Initializes a Fieldguide configuration in the current project directory.
 *
 * If a configuration already exists and the `force` option is not set, the process exits with an error. If no valid preset is provided, prompts the user to select one interactively. Creates a `.outfitter/config.json` file with the selected preset and associated fieldguides.
 *
 * @param options - Options for configuring the Fieldguide setup, including preset selection and force overwrite.
 *
 * @remark
 * Exits the process with code 1 if a configuration already exists and `force` is not specified.
 *
 * @throws {Error} If an error occurs during directory creation or file writing.
 */
export async function createFieldguideConfig(
  options: CreateOptions
): Promise<void> {
  const cwd = process.cwd();
  const outfitterDir = join(cwd, '.outfitter');

  // Check if already initialized
  if ((await pathExists(outfitterDir)) && !options.force) {
    console.error(
      chalk.red(
        'Fieldguide configuration already exists. Use --force to reinitialize.'
      )
    );
    process.exit(1);
  }

  // Interactive setup if no preset
  let selectedPreset = options.preset;
  if (!(selectedPreset && presets[selectedPreset as keyof typeof presets])) {
    const answers = (await inquirer.prompt([
      {
        type: 'list',
        name: 'preset',
        message: 'Select a project preset:',
        choices: [
          { name: 'Next.js Full Stack', value: 'nextjs' },
          { name: 'React SPA', value: 'react' },
          { name: 'Node.js Backend', value: 'node' },
          { name: 'Minimal (TypeScript only)', value: 'minimal' },
        ],
      },
    ])) as InquirerAnswers;
    selectedPreset = answers.preset;
  }

  const spinner = ora('Creating fieldguide configuration...').start();

  try {
    // Create .outfitter directory
    await ensureDir(outfitterDir);

    // Create config
    const config = {
      version: '0.1.0', // CLI package version
      preset: selectedPreset,
      fieldguides: presets[selectedPreset as keyof typeof presets],
      installed: new Date().toISOString(),
    };

    await writeJSON(join(outfitterDir, 'config.json'), config, { spaces: 2 });

    spinner.succeed('Fieldguide configuration created successfully!');

    console.log(`\n${chalk.green('✓')} Created .outfitter/config.json`);
    console.log(`\n${chalk.cyan('Next steps:')}`);
    console.log(
      `  1. Run ${chalk.yellow('outfitter fg add <fieldguide>')} to add specific fieldguides`
    );
    console.log(
      `  2. Run ${chalk.yellow('outfitter fg list')} to see available fieldguides`
    );
  } catch (error) {
    spinner.fail('Failed to create fieldguide configuration');
    throw error;
  }
}
