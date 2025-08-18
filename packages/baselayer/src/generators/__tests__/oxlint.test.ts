import *as childProcess from 'node:child_process';
import { isSuccess, type Result } from '@outfitter/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileSystemError } from '../../utils/file-system.js';
import* as fileSystem from '../../utils/file-system.js';
import { generateOxlintConfig } from '../oxlint.js';

describe('generateOxlintConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock file system functions
    vi.spyOn(fileSystem, 'fileExists').mockImplementation(vi.fn());
    vi.spyOn(fileSystem, 'readJSON').mockImplementation(vi.fn());
    vi.spyOn(fileSystem, 'writeJSON').mockImplementation(vi.fn());
  });

  it('should attempt ESLint migration when ESLint config exists', async () => {
    // Mock ESLint config exists
    vi.mocked(fileSystem.fileExists).mockResolvedValue({
      success: true,
      data: true,
    } as Result<boolean, FileSystemError>);

    const execSyncMock = vi
      .spyOn(childProcess, 'execSync')
      .mockImplementation(() => '');

    vi.mocked(fileSystem.readJSON).mockResolvedValue({
      success: true,
      data: {},
    } as Result<unknown, Error>);

    vi.mocked(fileSystem.writeJSON).mockResolvedValue({
      success: true,
      data: undefined,
    } as Result<unknown, Error>);

    const result = await generateOxlintConfig();

    expect(isSuccess(result)).toBe(true);
    expect(execSyncMock).toHaveBeenCalledWith(
      'npx @oxlint/migrate',
      expect.any(Object)
    );
  });

  it('should create new config when no ESLint config exists', async () => {
    // Mock no ESLint config
    vi.mocked(fileSystem.fileExists).mockResolvedValue({
      success: true,
      data: false,
    } as Result<unknown, Error>);

    const execSyncMock = vi
      .spyOn(childProcess, 'execSync')
      .mockImplementation(() => '');

    vi.mocked(fileSystem.readJSON).mockResolvedValue({
      success: true,
      data: {},
    } as Result<unknown, Error>);

    vi.mocked(fileSystem.writeJSON).mockResolvedValue({
      success: true,
      data: undefined,
    } as Result<unknown, Error>);

    const result = await generateOxlintConfig();

    expect(isSuccess(result)).toBe(true);
    expect(execSyncMock).toHaveBeenCalledWith(
      'bunx oxlint --init',
      expect.any(Object)
    );
  });

  it('should enhance config with recommended rules', async () => {
    vi.mocked(fileSystem.fileExists).mockResolvedValue({
      success: true,
      data: false,
    } as Result<unknown, Error>);

    vi.spyOn(childProcess, 'execSync').mockImplementation(() => '');

    vi.mocked(fileSystem.readJSON).mockResolvedValue({
      success: true,
      data: { rules: {} },
    } as Result<unknown, Error>);

    let writtenConfig: unknown;
    vi.mocked(fileSystem.writeJSON).mockImplementation(
      async (_path, config): Promise<Result<void, Error>> => {
        writtenConfig = config;
        return {
          success: true,
          data: undefined,
        };
      }
    );

    const result = await generateOxlintConfig();

    expect(isSuccess(result)).toBe(true);
    expect(writtenConfig).toHaveProperty('plugins');
    expect(writtenConfig.plugins).toContain('react');
    expect(writtenConfig.plugins).toContain('typescript');
    expect(writtenConfig.rules).toHaveProperty('no-debugger', 'error');
    expect(writtenConfig.rules).toHaveProperty(
      'react-hooks/rules-of-hooks',
      'error'
    );
  });
});
