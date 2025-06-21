import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import type { ArgumentsCamelCase } from 'yargs';
import { colors } from '../utils/colors.js';
import { getPresetConfig } from '../presets/index.js';
import type { PresetName } from '../types.js';

interface FormatCommandArgs {
  source?: string;
  path?: string;
  input?: boolean;
  text?: string;
  preset?: PresetName;
  output?: boolean;
  quiet?: boolean;
}

// Create require for markdownlint-cli2
const require = createRequire(import.meta.url);

export async function formatCommand(argv: ArgumentsCamelCase<FormatCommandArgs>): Promise<void> {
  const { source, path, input, text, preset, output = true, quiet } = argv;

  let content: string;
  let sourceName: string;

  try {
    // Get content based on source
    if (text) {
      content = text;
      sourceName = 'inline text';
    } else if (input) {
      // Read from stdin
      content = await readStdin();
      sourceName = 'stdin';
    } else if (source === 'file' && path) {
      if (!existsSync(path)) {
        throw new Error(`File not found: ${path}`);
      }
      content = readFileSync(path, 'utf-8');
      sourceName = path;
    } else {
      throw new Error('No valid source specified. Use --text, --input, or specify file source.');
    }

    if (!content.trim()) {
      throw new Error(`No content found in ${sourceName}`);
    }

    // Format using markdownlint-cli2
    if (!quiet) {
      console.log(colors.info('Formatting...'));
    }
    const formatted = await formatMarkdown(content, preset);

    // Handle output
    if (output) {
      console.log(formatted);
    }

    if (!quiet) {
      console.log(colors.success('✅ Formatted successfully'));
    }
  } catch (error) {
    console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let content = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      content += chunk;
    });

    process.stdin.on('end', () => {
      resolve(content);
    });

    process.stdin.on('error', (error) => {
      reject(error);
    });

    // Check if stdin is a TTY (no piped input)
    if (process.stdin.isTTY) {
      reject(new Error('No input provided. Pipe content or use --text flag.'));
    }
  });
}

/**
 * Formats Markdown content using markdownlint-cli2, optionally applying a preset configuration.
 *
 * Writes the input content to a temporary file, runs markdownlint-cli2 with the `--fix` flag, and returns the formatted Markdown as a string. If a preset is provided, its configuration is used for formatting.
 *
 * @param content - The Markdown content to format
 * @param preset - Optional preset configuration to apply during formatting
 * @returns The formatted Markdown content
 */
async function formatMarkdown(content: string, preset?: PresetName): Promise<string> {
  const { main: markdownlintCli2Main } = require('markdownlint-cli2');

  // Create a temporary directory
  const tempDir = mkdtempSync(join(tmpdir(), 'rightdown-'));
  const tempFile = join(tempDir, 'content.md');
  let tempConfigPath: string | undefined;

  try {
    // Write content to temp file
    writeFileSync(tempFile, content);

    // Build args for markdownlint-cli2
    const args = [tempFile, '--fix'];

    if (preset) {
      // Create a config file in temp directory
      tempConfigPath = join(tempDir, '.markdownlint.json');
      const presetConfig = getPresetConfig(preset);
      // Remove customRules for formatting (they may not exist in the expected path)
      delete presetConfig.customRules;
      writeFileSync(tempConfigPath, JSON.stringify(presetConfig, null, 2));
      args.push('--config', tempConfigPath);
    }

    // Run markdownlint-cli2
    const params = {
      argv: args,
      logMessage: () => {}, // Suppress output
      logError: () => {}, // Suppress errors (we'll handle them)
    };

    await markdownlintCli2Main(params);

    // Read the formatted content
    const formatted = readFileSync(tempFile, 'utf-8');

    // Clean up temp files
    if (existsSync(tempFile)) {
      unlinkSync(tempFile);
    }
    if (tempConfigPath && existsSync(tempConfigPath)) {
      unlinkSync(tempConfigPath);
    }
    // Remove temp directory
    if (existsSync(tempDir)) {
      require('fs').rmSync(tempDir, { recursive: true, force: true });
    }

    return formatted;
  } catch (error) {
    // Clean up on error
    if (existsSync(tempFile)) {
      unlinkSync(tempFile);
    }
    if (tempConfigPath && existsSync(tempConfigPath)) {
      unlinkSync(tempConfigPath);
    }
    // Remove temp directory
    if (existsSync(tempDir)) {
      require('fs').rmSync(tempDir, { recursive: true, force: true });
    }

    throw error;
  }
}
