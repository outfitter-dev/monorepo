import { isSuccess, type Result } from '@outfitter/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileSystemError } from '../../utils/file-system.js';
import * as fileSystem from '../../utils/file-system.js';
import { updatePackageScripts } from '../package-scripts.js';

describe('updatePackageScripts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock file system functions
    vi.spyOn(fileSystem, 'readPackageJson').mockImplementation(vi.fn());
    vi.spyOn(fileSystem, 'writePackageJson').mockImplementation(vi.fn());
  });

  it('should add Flint scripts to package.json', async () => {
    vi.mocked(fileSystem.readPackageJson).mockResolvedValue({
      success: true,
      data: {
        name: 'test-project',
        scripts: {
          test: 'vitest',
          build: 'tsc',
        },
      },
    } as Result<Record<string, unknown>, FileSystemError>);

    let writtenPackage: Record<string, unknown>;
    vi.mocked(fileSystem.writePackageJson).mockImplementation(async (pkg) => {
      writtenPackage = pkg;
      return {
        success: true,
        data: undefined,
      } as Result<void, FileSystemError>;
    });

    const result = await updatePackageScripts();

    expect(isSuccess(result)).toBe(true);
    expect(writtenPackage.scripts).toHaveProperty(
      'format',
      'bunx ultracite format --write .'
    );
    expect(writtenPackage.scripts).toHaveProperty('lint', 'oxlint');
    expect(writtenPackage.scripts).toHaveProperty(
      'prepare',
      'lefthook install'
    );
    // Existing scripts should be preserved
    expect(writtenPackage.scripts).toHaveProperty('test', 'vitest');
    expect(writtenPackage.scripts).toHaveProperty('build', 'tsc');
  });

  it('should create scripts object if it does not exist', async () => {
    vi.mocked(fileSystem.readPackageJson).mockResolvedValue({
      success: true,
      data: {
        name: 'test-project',
      },
    } as Result<Record<string, unknown>, FileSystemError>);

    let writtenPackage: Record<string, unknown>;
    vi.mocked(fileSystem.writePackageJson).mockImplementation(async (pkg) => {
      writtenPackage = pkg;
      return {
        success: true,
        data: undefined,
      } as Result<void, FileSystemError>;
    });

    const result = await updatePackageScripts();

    expect(isSuccess(result)).toBe(true);
    expect(writtenPackage.scripts).toBeDefined();
    expect(writtenPackage.scripts).toHaveProperty('format');
    expect(writtenPackage.scripts).toHaveProperty('lint');
  });

  it('should override Flint-managed scripts but preserve others', async () => {
    vi.mocked(fileSystem.readPackageJson).mockResolvedValue({
      success: true,
      data: {
        name: 'test-project',
        scripts: {
          test: 'jest', // Custom test script
          format: 'prettier --write .', // Old format script - should be replaced
          custom: 'echo custom', // Custom script - should be preserved
        },
      },
    } as Result<Record<string, unknown>, FileSystemError>);

    let writtenPackage: Record<string, unknown>;
    vi.mocked(fileSystem.writePackageJson).mockImplementation(async (pkg) => {
      writtenPackage = pkg;
      return {
        success: true,
        data: undefined,
      } as Result<void, FileSystemError>;
    });

    const result = await updatePackageScripts();

    expect(isSuccess(result)).toBe(true);
    expect(writtenPackage.scripts).toHaveProperty(
      'format',
      'bunx ultracite format --write .'
    );
    expect(writtenPackage.scripts).toHaveProperty('test', 'jest'); // Preserved
    expect(writtenPackage.scripts).toHaveProperty('custom', 'echo custom'); // Preserved
  });
});
