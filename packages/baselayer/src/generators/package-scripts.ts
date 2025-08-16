import { failure, isFailure, type Result, success } from '@outfitter/contracts';
import { readPackageJson, writePackageJson } from '../utils/file-system.js';

/**
 * Updates package.json with Flint-managed scripts
 */
export async function updatePackageScripts(): Promise<Result<void, Error>> {
  try {
    const pkgResult = await readPackageJson();
    if (isFailure(pkgResult)) {
      return failure(new Error(pkgResult.error.message));
    }

    const packageJson = pkgResult.data;

    const scripts = {
      // Formatting commands
      format: 'bunx ultracite format --write .',
      'format:check': 'bunx ultracite format .',
      'format:md': "prettier --write '**/*.{md,mdx}'",
      'format:css': "prettier --write '**/*.{css,scss,less}'",
      'format:other': "prettier --write '**/*.{json,yaml,yml,html}'",
      'format:all':
        'bun run format && bun run format:md && bun run format:css && bun run format:other',

      // Linting commands
      lint: 'oxlint',
      'lint:fix': 'oxlint --fix',
      'lint:md': "markdownlint-cli2 '**/*.md'",
      'lint:md:fix': "markdownlint-cli2 --fix '**/*.md'",
      'lint:css': "stylelint '**/*.{css,scss,less}'",
      'lint:css:fix': "stylelint --fix '**/*.{css,scss,less}'",
      'lint:all': 'bun run lint && bun run lint:md && bun run lint:css',

      // Combined commands
      check: 'bun run format:check && bun run lint:all',
      'check:fix':
        'bun run format:all && bun run lint:fix && bun run lint:md:fix && bun run lint:css:fix',

      // CI command
      ci: 'bun run check',

      // Git hooks
      prepare: 'lefthook install',
    };

    // Only add scripts that don't exist or update Flint-managed ones
    const existingScripts = packageJson.scripts as
      | Record<string, string>
      | undefined;
    const scriptsToUpdate = existingScripts || {};

    // Track which scripts we're managing
    const flintManagedScripts = new Set(Object.keys(scripts));

    // Add or update our scripts
    for (const [name, command] of Object.entries(scripts)) {
      // Only override if it's a script we manage or doesn't exist
      if (!scriptsToUpdate[name] || flintManagedScripts.has(name)) {
        scriptsToUpdate[name] = command;
      }
    }

    // Update the package.json with the new scripts
    packageJson.scripts = scriptsToUpdate;

    // Preserve existing test, build, dev scripts etc.
    // Just ensure they're not conflicting with our naming

    const writeResult = await writePackageJson(packageJson);
    if (isFailure(writeResult)) {
      return failure(new Error(writeResult.error.message));
    }
    // Scripts successfully updated

    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}
