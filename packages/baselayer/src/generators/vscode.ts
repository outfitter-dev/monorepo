import path from 'node:path';
import {
  failure,
  isFailure,
  isSuccess,
  type Result,
  success,
} from '@outfitter/contracts';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import {
  ensureDir,
  fileExists,
  readJSON,
  writeJSON,
} from '../utils/file-system.js';

/**

- Checks if VS Code directory exists
 */
export async function hasVSCode(): Promise<boolean> {
  const result = await fileExists('.vscode');
  return isSuccess(result) && result.data;
}

/**

- Merges new VS Code settings with existing ones
 */
async function mergeVSCodeSettings(
  newSettings: Record<string, unknown>
): Promise<Result<void, Error>> {
  const settingsPath = path.join('.vscode', 'settings.json');
  let existingSettings = {};

  const fileExistsResult = await fileExists(settingsPath);
  if (isSuccess(fileExistsResult) && fileExistsResult.data) {
    const readResult = await readJSON(settingsPath);
    if (isSuccess(readResult)) {
      existingSettings = readResult.data as Record<string, unknown>;
    }
  }

  const merged = {
    ...existingSettings,
    ...newSettings,
  };

  const ensureDirResult = await ensureDir('.vscode');
  if (isFailure(ensureDirResult)) {
    return failure(new Error(ensureDirResult.error.message));
  }

  const writeResult = await writeJSON(settingsPath, merged);
  if (isFailure(writeResult)) {
    return failure(new Error(writeResult.error.message));
  }
  return success(undefined);
}

/**

- Merges new VS Code extensions with existing ones
 */
async function mergeVSCodeExtensions(newExtensions: {
  recommendations: string[];
}): Promise<Result<void, Error>> {
  const extensionsPath = path.join('.vscode', 'extensions.json');
  let existingExtensions: { recommendations: string[] } = {
    recommendations: [],
  };

  const fileExistsResult = await fileExists(extensionsPath);
  if (isSuccess(fileExistsResult) && fileExistsResult.data) {
    const readResult = await readJSON(extensionsPath);
    if (isSuccess(readResult)) {
      existingExtensions = readResult.data as { recommendations: string[] };
    }
  }

  const merged = {
    ...existingExtensions,
    recommendations: [
      ...new Set([
        ...(existingExtensions.recommendations || []),
        ...(newExtensions.recommendations || []),
      ]),
    ],
  };

  const ensureDirResult = await ensureDir('.vscode');
  if (isFailure(ensureDirResult)) {
    return failure(new Error(ensureDirResult.error.message));
  }

  const writeResult = await writeJSON(extensionsPath, merged);
  if (isFailure(writeResult)) {
    return failure(new Error(writeResult.error.message));
  }
  return success(undefined);
}

/**

- Generate VSCode settings.json based on baselayer configuration
 */
export function generateVSCodeSettings(
  config?: BaselayerConfig
): Record<string, unknown> {
  const settings: Record<string, unknown> = {
    // Base editor settings
    'editor.formatOnSave': true,
    'editor.formatOnPaste': false,
    'files.eol': '\n',
    'files.trimTrailingWhitespace': true,
    'files.insertFinalNewline': true,
    'files.trimFinalNewlines': true,
  };

  const codeActions: Record<string, string> = {};

  // TypeScript/JavaScript settings (enabled by default)
  if (config?.features?.typescript !== false) {
    Object.assign(settings, {
      '[typescript]': { 'editor.defaultFormatter': 'biomejs.biome' },
      '[typescriptreact]': { 'editor.defaultFormatter': 'biomejs.biome' },
      '[javascript]': { 'editor.defaultFormatter': 'biomejs.biome' },
      '[javascriptreact]': { 'editor.defaultFormatter': 'biomejs.biome' },
      'biome.enabled': true,
      'typescript.preferences.quoteStyle': 'single',
      'typescript.suggest.autoImports': true,
    });

    codeActions['source.organizeImports.biome'] = 'explicit';
    codeActions['source.fixAll.biome'] = 'explicit';
  }

  // JSON settings (enabled by default)
  if (config?.features?.json !== false) {
    Object.assign(settings, {
      '[json]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
      '[jsonc]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
    });
  }

  // Markdown settings (enabled by default)
  if (config?.features?.markdown !== false) {
    Object.assign(settings, {
      '[markdown]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
      '[mdx]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
    });
  }

  // CSS/SCSS settings (disabled by default)
  if (config?.features?.styles === true) {
    Object.assign(settings, {
      '[css]': { 'editor.defaultFormatter': 'stylelint.vscode-stylelint' },
      '[scss]': { 'editor.defaultFormatter': 'stylelint.vscode-stylelint' },
      '[less]': { 'editor.defaultFormatter': 'stylelint.vscode-stylelint' },
      'css.validate': false,
      'scss.validate': false,
      'less.validate': false,
    });

    codeActions['source.fixAll.stylelint'] = 'explicit';
  } else {
    // If no stylelint, use prettier for CSS
    Object.assign(settings, {
      '[css]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
      '[scss]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
      '[less]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
    });
  }

  // YAML settings
  Object.assign(settings, {
    '[yaml]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
    '[yml]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
  });

  // Framework-specific settings
  if (
    config?.project?.framework === 'react' ||
    config?.project?.framework === 'next'
  ) {
    Object.assign(settings, {
      'emmet.includeLanguages': {
        javascript: 'javascriptreact',
        typescript: 'typescriptreact',
      },
      'emmet.triggerExpansionOnTab': false,
    });
  }

  // Testing settings
  if (config?.features?.testing === true) {
    Object.assign(settings, {
      'vitest.enable': true,
      'vitest.runOnSave': false,
    });
  }

  // Monorepo settings
  if (config?.project?.type === 'monorepo') {
    Object.assign(settings, {
      'search.exclude': {
        '**/node_modules': true,
        '**/dist': true,
        '**/build': true,
        'packages/**/node_modules': true,
        'packages/**/dist': true,
      },
      'files.watcherExclude': {
        '**/node_modules/**': true,
        '**/dist/**': true,
        '**/build/**': true,
        'packages/**/node_modules/**': true,
        'packages/**/dist/**': true,
      },
    });
  }

  // Apply code actions if any were set
  if (Object.keys(codeActions).length > 0) {
    settings['editor.codeActionsOnSave'] = codeActions;
  }

  return settings;
}

/**

- Generate VSCode extensions.json based on configuration
 */
export function generateVSCodeExtensions(config?: BaselayerConfig): {
  recommendations: string[];
} {
  const extensions: string[] = [];

  // Core extensions always included
  extensions.push('editorconfig.editorconfig', 'esbenp.prettier-vscode');

  // TypeScript extensions (enabled by default)
  if (config?.features?.typescript !== false) {
    extensions.push('biomejs.biome', 'ms-vscode.vscode-typescript-next');
  }

  // Markdown extensions (enabled by default)
  if (config?.features?.markdown !== false) {
    extensions.push('DavidAnson.vscode-markdownlint');
  }

  // CSS/Stylelint extensions
  if (config?.features?.styles === true) {
    extensions.push('stylelint.vscode-stylelint');
  }

  // Testing extensions
  if (config?.features?.testing === true) {
    extensions.push('vitest.explorer');
  }

  // Framework-specific extensions
  if (config?.project?.framework === 'react') {
    extensions.push(
      'ms-vscode.vscode-react-native',
      'bradlc.vscode-tailwindcss'
    );
  } else if (config?.project?.framework === 'next') {
    extensions.push(
      'ms-vscode.vscode-react-native',
      'bradlc.vscode-tailwindcss'
    );
  } else if (config?.project?.framework === 'vue') {
    extensions.push('Vue.volar');
  } else if (config?.project?.framework === 'svelte') {
    extensions.push('svelte.svelte-vscode');
  }

  // Monorepo extensions
  if (config?.project?.type === 'monorepo') {
    extensions.push('ms-vscode.vscode-folder-source-actions');
  }

  // General development extensions
  extensions.push(
    'streetsidesoftware.code-spell-checker',
    'ms-vscode.vscode-json'
  );

  return {
    recommendations: [...new Set(extensions)].sort(),
  };
}

/**

- Sets up VS Code configuration
 */
export async function setupVSCode(
  config?: BaselayerConfig
): Promise<Result<void, Error>> {
  try {
    // Generate settings based on configuration
    const settings = generateVSCodeSettings(config);
    const extensions = generateVSCodeExtensions(config);

    // Merge settings
    const settingsResult = await mergeVSCodeSettings(settings);
    if (isFailure(settingsResult)) {
      return failure(new Error(settingsResult.error.message));
    }

    // Merge extensions
    const extensionsResult = await mergeVSCodeExtensions(extensions);
    if (isFailure(extensionsResult)) {
      return failure(new Error(extensionsResult.error.message));
    }

    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}

/**

- Enhances VS Code settings after other tools have set up their configs
- This is called after Ultracite init to ensure we don't override its settings
 */
export async function enhanceVSCodeSettings(
  config?: BaselayerConfig
): Promise<Result<void, Error>> {
  try {
    // Generate minimal additional settings that Ultracite doesn't handle
    const additionalSettings: Record<string, unknown> = {};
    const additionalExtensions: string[] = [];

    // Only add formatters for languages that Ultracite doesn't cover
    if (config?.features?.markdown !== false) {
      Object.assign(additionalSettings, {
        '[markdown]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
        '[mdx]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
      });
      additionalExtensions.push('DavidAnson.vscode-markdownlint');
    }

    // CSS formatting based on stylelint configuration
    if (config?.features?.styles === true) {
      Object.assign(additionalSettings, {
        'css.validate': false,
        'scss.validate': false,
        'less.validate': false,
      });
      additionalExtensions.push('stylelint.vscode-stylelint');
    } else {
      Object.assign(additionalSettings, {
        '[css]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
        '[scss]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
        '[less]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
      });
    }

    // YAML formatting
    Object.assign(additionalSettings, {
      '[yaml]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
      '[yml]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
    });

    // Always include editorconfig
    additionalExtensions.push('editorconfig.editorconfig');

    // Merge additional settings
    if (Object.keys(additionalSettings).length > 0) {
      const settingsResult = await mergeVSCodeSettings(additionalSettings);
      if (isFailure(settingsResult)) {
        return failure(new Error(settingsResult.error.message));
      }
    }

    // Merge additional extensions
    if (additionalExtensions.length > 0) {
      const extensionsResult = await mergeVSCodeExtensions({
        recommendations: additionalExtensions,
      });
      if (isFailure(extensionsResult)) {
        return failure(new Error(extensionsResult.error.message));
      }
    }

    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}
