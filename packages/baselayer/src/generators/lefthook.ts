import { failure, isFailure, type Result, success } from '@outfitter/contracts';
import * as yaml from 'yaml';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import { type FileSystemError, writeFile } from '../utils/file-system.js';

export interface LefthookGeneratorOptions {
  config?: BaselayerConfig;
  packageManager?: 'bun' | 'npm' | 'yarn' | 'pnpm';
  skipCommitlint?: boolean;
  skipPrePush?: boolean;
  verbose?: boolean;
}

/**

- Generates Lefthook configuration for Git hooks
- Sets up pre-commit formatting and linting with the new orchestration system
 */
export async function generateLefthookConfig(
  options: LefthookGeneratorOptions = {}
): Promise<Result<void, FileSystemError>> {
  try {
    const {
      config: userConfig,
      packageManager = 'bun',
      skipCommitlint = false,
      skipPrePush = false,
      verbose = false,
    } = options;

    if (verbose) {
    }

    // Get package manager command prefix
    const pmx = packageManager === 'bun' ? 'bunx' : `${packageManager} dlx`;

    // Build configuration based on enabled features
    const features = userConfig?.features ?? {
      typescript: true,
      markdown: true,
      styles: true,
      json: true,
      commits: true,
    };

    const preCommitCommands: Record<string, unknown> = {};

    // TypeScript/JavaScript formatting and linting (Ultracite)
    if (features.typescript !== false) {
      preCommitCommands['ultracite-lint'] = {
        glob: '*.{js,jsx,ts,tsx,mjs,cjs}',
        run: `${pmx} ultracite lint {staged_files}`,
      };

      preCommitCommands['ultracite-format'] = {
        glob: '*.{js,jsx,ts,tsx,mjs,cjs}',
        run: `${pmx} ultracite format --write {staged_files} && git add {staged_files}`,
      };
    }

    // JSON/YAML formatting (Prettier)
    if (features.json !== false) {
      preCommitCommands['format-json'] = {
        glob: '*.{json,yaml,yml}',
        run: `${pmx} prettier --write {staged_files} && git add {staged_files}`,
      };
    }

    // Markdown formatting and linting
    if (features.markdown !== false) {
      preCommitCommands['format-md'] = {
        glob: '*.{md,mdx}',
        run: `${pmx} prettier --write {staged_files} && git add {staged_files}`,
      };

      preCommitCommands['lint-md'] = {
        glob: '*.md',
        run: `${pmx} markdownlint-cli2 {staged_files}`,
      };
    }

    // CSS/SCSS formatting and linting (Stylelint)
    if (features.styles !== false) {
      preCommitCommands['format-css'] = {
        glob: '*.{css,scss,sass,less}',
        run: `${pmx} prettier --write {staged_files} && git add {staged_files}`,
      };

      preCommitCommands['lint-css'] = {
        glob: '*.{css,scss,sass,less}',
        run: `${pmx} stylelint {staged_files}`,
      };
    }

    const config: Record<string, unknown> = {};

    // Pre-commit hook
    if (Object.keys(preCommitCommands).length > 0) {
      config['pre-commit'] = {
        parallel: false,
        commands: preCommitCommands,
      };
    }

    // Commit message validation
    if (features.commits !== false && !skipCommitlint) {
      config['commit-msg'] = {
        commands: {
          commitlint: {
            run: `${pmx} commitlint --edit {1}`,
          },
        },
      };
    }

    // Pre-push hook for testing and type checking
    if (!skipPrePush) {
      const prePushCommands: Record<string, unknown> = {};

      // Add test command based on package manager
      if (packageManager === 'bun') {
        prePushCommands.test = {
          run: 'bun test --run',
          skip: [{ ref: 'refs/heads/wip' }, { ref: 'refs/heads/draft' }],
        };
      } else {
        prePushCommands.test = {
          run: `${packageManager} test`,
          skip: [{ ref: 'refs/heads/wip' }, { ref: 'refs/heads/draft' }],
        };
      }

      // Add type check if TypeScript is enabled
      if (features.typescript !== false) {
        prePushCommands['type-check'] = {
          run:
            packageManager === 'bun'
              ? 'bun run type-check'
              : `${packageManager} run type-check`,
          skip: [{ ref: 'refs/heads/wip' }, { ref: 'refs/heads/draft' }],
        };
      }

      config['pre-push'] = {
        commands: prePushCommands,
      };
    }

    // Write lefthook.yml
    const yamlContent = yaml.stringify(config, {
      lineWidth: 120,
      minContentWidth: 0,
    });

    // Add header comment
    const fullContent = `# Lefthook configuration

# https://github.com/evilmartians/lefthook

${yamlContent}`;

    const writeResult = await writeFile('lefthook.yml', fullContent);
    if (isFailure(writeResult)) {
      return failure(writeResult.error);
    }
    return success(undefined);
  } catch (error) {
    return failure({
      type: 'FILE_SYSTEM_ERROR',
      code: 'GENERATION_FAILED',
      message: `Failed to generate lefthook config: ${(error as Error).message}`,
    } as FileSystemError);
  }
}
