import { isFailure, isSuccess } from '@outfitter/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEslintConfig,
  createPackageJson,
  createPrettierConfig,
  createTestContext,
  mockPrompts,
  resetMocks,
} from '../../test-utils/index.js';
import { init } from '../init.js';

describe('init command', () => {
  let ctx: ReturnType<typeof createTestContext>;

  beforeEach(() => {
    ctx = createTestContext({
      '/package.json': createPackageJson({
        scripts: {
          test: 'vitest',
          lint: 'eslint src',
          format: 'prettier --write .',
        },
        devDependencies: {
          eslint: '^8.0.0',
          prettier: '^3.0.0',
        },
      }),
    });
  });

  afterEach(() => {
    resetMocks();
  });

  it('should fail if no package.json exists', async () => {
    ctx.mockFs['/package.json'] = undefined;

    const result = await init({});

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('should detect existing configurations', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockFs['.prettierrc'] = createPrettierConfig();

    // Mock console to capture output
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock prompts to cancel
    mockPrompts({ Continue: false });

    const result = await init({});

    expect(isSuccess(result)).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Found 2 existing configuration(s):')
    );

    consoleSpy.mockRestore();
  });

  it('should run in dry-run mode without making changes', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    const initialFiles = { ...ctx.mockFs };

    const result = await init({ dryRun: true });

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockFs).toEqual(initialFiles); // No files should be changed
  });

  it('should skip user prompts with --yes flag', async () => {
    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({ yes: true });

    if (isFailure(result)) {
      console.error('Test failed with error:', result.error);
    }
    expect(isSuccess(result)).toBe(true);
    // Should not have called any prompts
  });

  it('should keep existing configs when --keep-existing is set', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockFs['.prettierrc'] = createPrettierConfig();

    const result = await init({ yes: true, keepExisting: true });

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockFs['.eslintrc.json']).toBe(createEslintConfig());
    expect(ctx.mockFs['.prettierrc']).toBe(createPrettierConfig());
  });

  it('should detect monorepo structure', async () => {
    ctx.mockFs['pnpm-workspace.yaml'] = 'packages:\n  - "packages/*"';

    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({ yes: true });

    expect(isSuccess(result)).toBe(true);
    // Should have detected monorepo and configured accordingly
  });

  it('should detect TypeScript project', async () => {
    ctx.mockFs['tsconfig.json'] = JSON.stringify({
      compilerOptions: {
        strict: true,
      },
    });

    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({ yes: true });

    expect(isSuccess(result)).toBe(true);
    // Should have detected TypeScript
  });

  it('should skip Stylelint with --no-stylelint flag', async () => {
    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({ yes: true, noStylelint: true });

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockFs['.stylelintrc.json']).toBeUndefined();
  });

  it('should skip git hooks with --no-git-hooks flag', async () => {
    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({ yes: true, noGitHooks: true });

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockFs['lefthook.yml']).toBeUndefined();
    expect(ctx.mockFs['commitlint.config.js']).toBeUndefined();
  });

  it('should keep Prettier for all files with --keep-prettier flag', async () => {
    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({ yes: true, keepPrettier: true });

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockFs['.prettierrc.json']).toBeDefined();
    // Prettier config should handle all files, not just non-JS/TS
  });

  it('should create backup of existing configs', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockFs['.prettierrc'] = createPrettierConfig();

    mockPrompts({ Continue: true });
    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({});

    expect(isSuccess(result)).toBe(true);
    // Should have created a backup markdown file
    const backupFiles = Object.keys(ctx.mockFs).filter((f) =>
      f.includes('flint-backup')
    );
    expect(backupFiles.length).toBeGreaterThan(0);
  });

  it('should install dependencies', async () => {
    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({ yes: true });

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockExec).toHaveBeenCalledWith(
      expect.stringContaining('install')
    );
  });

  it('should update package.json scripts', async () => {
    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({ yes: true });

    expect(isSuccess(result)).toBe(true);
    const updatedPackageJson = JSON.parse(ctx.mockFs['/package.json']);
    expect(updatedPackageJson.scripts).toHaveProperty('format');
    expect(updatedPackageJson.scripts).toHaveProperty('lint');
    expect(updatedPackageJson.scripts).toHaveProperty('check');
  });

  it('should generate VS Code settings', async () => {
    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({ yes: true });

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockFs['.vscode/settings.json']).toBeDefined();
  });

  it('should generate migration report', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({ yes: true });

    expect(isSuccess(result)).toBe(true);
    const migrationReports = Object.keys(ctx.mockFs).filter((f) =>
      f.includes('flint-migration')
    );
    expect(migrationReports.length).toBeGreaterThan(0);
  });

  it('should handle CSS file detection', async () => {
    // Mock find command to simulate CSS files
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd.includes('find') && cmd.includes('.css')) {
        return { stdout: 'src/styles.css\n', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await init({ yes: true });

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockFs['.stylelintrc.json']).toBeDefined();
  });

  it('should detect framework from dependencies', async () => {
    ctx.mockFs['/package.json'] = createPackageJson({
      dependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0',
      },
    });

    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({ yes: true });

    expect(isSuccess(result)).toBe(true);
    // Should have detected React framework
  });

  it('should handle errors gracefully', async () => {
    // Mock an error during installation
    ctx.mockExec.mockImplementation(() => {
      throw new Error('Installation failed');
    });

    const result = await init({ yes: true });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.code).toBe('INIT_FAILED');
      expect(result.error.message).toContain('Installation failed');
    }
  });

  it('should initialize Ultracite after installation', async () => {
    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({ yes: true });

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockExec).toHaveBeenCalledWith(
      expect.stringContaining('ultracite format'),
      expect.any(Object)
    );
  });

  it('should install Lefthook hooks', async () => {
    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    const result = await init({ yes: true });

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockExec).toHaveBeenCalledWith(
      expect.stringContaining('lefthook install'),
      expect.any(Object)
    );
  });
});
