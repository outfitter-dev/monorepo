import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { isSuccess } from '@outfitter/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateCommitlintConfig,
  generateEditorconfigConfig,
  generateLefthookConfig,
  generateMarkdownlintConfig,
  generatePrettierConfig,
  generateStylelintConfig,
  setupVSCode,
  updatePackageScripts,
} from '../index.js';

describe('Generator Integration Tests', () => {
  let tempDir: string;
  let originalDir: string;

  beforeEach(async () => {
    // Save original directory
    originalDir = process.cwd();

    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'flint-test-'));
    process.chdir(tempDir);

    // Create a basic package.json
    await fs.writeFile(
      'package.json',
      JSON.stringify(
        {
          name: 'test-project',
          version: '1.0.0',
          scripts: {
            test: 'vitest',
          },
        },
        null,
        2
      )
    );
  });

  afterEach(async () => {
    // Restore original directory
    process.chdir(originalDir);

    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should generate all configuration files without conflicts', async () => {
    // Note: We mock the execSync calls since we don't want to actually run external commands
    vi.mock('node:child_process', () => ({
      execSync: vi.fn(),
    }));

    // Generate configs (except Biome and Oxlint which need mocking)
    const prettierResult = await generatePrettierConfig();
    expect(isSuccess(prettierResult)).toBe(true);

    const markdownlintResult = await generateMarkdownlintConfig();
    expect(isSuccess(markdownlintResult)).toBe(true);

    const stylelintResult = await generateStylelintConfig();
    expect(isSuccess(stylelintResult)).toBe(true);

    const lefthookResult = await generateLefthookConfig();
    expect(isSuccess(lefthookResult)).toBe(true);

    const editorconfigResult = await generateEditorconfigConfig();
    expect(isSuccess(editorconfigResult)).toBe(true);

    const commitlintResult = await generateCommitlintConfig();
    expect(isSuccess(commitlintResult)).toBe(true);

    const vscodeResult = await setupVSCode();
    expect(isSuccess(vscodeResult)).toBe(true);

    const scriptsResult = await updatePackageScripts();
    if (!isSuccess(scriptsResult)) {
    }
    expect(isSuccess(scriptsResult)).toBe(true);

    // Helper function for cleaner assertions
    const expectFileExists = async (path: string) =>
      expect(
        await fs
          .access(path)
          .then(() => true)
          .catch(() => false)
      ).toBe(true);

    // Verify files were created
    await expectFileExists('.prettierrc.json');
    await expectFileExists('.prettierignore');
    await expectFileExists('.markdownlint-cli2.yaml');
    await expectFileExists('.stylelintrc.json');
    await expectFileExists('.stylelintignore');
    await expectFileExists('lefthook.yml');
    await expectFileExists('.editorconfig');
    await expectFileExists('.commitlintrc.json');
    await expectFileExists('.vscode/settings.json');
    await expectFileExists('.vscode/extensions.json');

    // Verify package.json was updated
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    expect(packageJson.scripts).toHaveProperty('format');
    expect(packageJson.scripts).toHaveProperty('lint');
    expect(packageJson.scripts).toHaveProperty('prepare', 'lefthook install');
    expect(packageJson.scripts).toHaveProperty('test', 'vitest'); // Original preserved
  });

  it('should generate valid YAML files', async () => {
    const markdownlintResult = await generateMarkdownlintConfig();
    expect(isSuccess(markdownlintResult)).toBe(true);

    const lefthookResult = await generateLefthookConfig();
    expect(isSuccess(lefthookResult)).toBe(true);

    const markdownlintContent = await fs.readFile(
      '.markdownlint-cli2.yaml',
      'utf-8'
    );
    const lefthookContent = await fs.readFile('lefthook.yml', 'utf-8');

    // Basic YAML validation
    expect(markdownlintContent).toContain('config:');
    expect(markdownlintContent).toContain('globs:');
    expect(markdownlintContent).toContain('ignores:');

    expect(lefthookContent).toContain('pre-commit:');
    expect(lefthookContent).toContain('commit-msg:');
    expect(lefthookContent).toContain('commands:');
  });

  it('should generate valid JSON files', async () => {
    const prettierResult = await generatePrettierConfig();
    expect(isSuccess(prettierResult)).toBe(true);

    const stylelintResult = await generateStylelintConfig();
    expect(isSuccess(stylelintResult)).toBe(true);

    const commitlintResult = await generateCommitlintConfig();
    expect(isSuccess(commitlintResult)).toBe(true);

    const prettierConfig = JSON.parse(
      await fs.readFile('.prettierrc.json', 'utf-8')
    );
    const stylelintConfig = JSON.parse(
      await fs.readFile('.stylelintrc.json', 'utf-8')
    );
    const commitlintConfig = JSON.parse(
      await fs.readFile('.commitlintrc.json', 'utf-8')
    );

    expect(prettierConfig).toHaveProperty('semi', true);
    expect(prettierConfig).toHaveProperty('singleQuote', true);

    expect(stylelintConfig).toHaveProperty('extends');
    expect(stylelintConfig).toHaveProperty('rules');

    expect(commitlintConfig).toHaveProperty('extends');
    expect(commitlintConfig).toHaveProperty('rules');
  });
});
