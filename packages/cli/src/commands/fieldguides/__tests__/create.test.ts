import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { CliUx } from '@oclif/core';
import create from '../create.js';

jest.mock('fs-extra');
jest.mock('@oclif/core');

describe('fieldguides:create', () => {
  const guideName = 'test-guide';
  const guideDir = path.join(process.cwd(), guideName);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new field guide with valid inputs', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    const logSpy = jest.spyOn(CliUx.ux, 'log').mockImplementation(() => {});

    await create.run([guideName]);

    expect(fs.existsSync).toHaveBeenCalledWith(guideDir);
    expect(fs.ensureDir).toHaveBeenCalledWith(guideDir);
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(guideDir, 'fieldguide.json'),
      expect.any(String),
      'utf8'
    );
    expect(logSpy).toHaveBeenCalledWith(
      `Field guide ${guideName} created successfully.`
    );
  });

  it('should throw error when field guide already exists', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    await expect(create.run([guideName])).rejects.toThrow(
      `Field guide '${guideName}' already exists`
    );
  });

  it('should validate name and reject invalid characters', async () => {
    const invalidName = 'invalid/name';
    await expect(create.run([invalidName])).rejects.toThrow(
      'Invalid field guide name'
    );
  });

  it('should handle FS errors gracefully', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.ensureDir as jest.Mock).mockRejectedValue(
      new Error('permission denied')
    );

    await expect(create.run([guideName])).rejects.toThrow('permission denied');
  });

  it('should generate files with correct content (snapshot)', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
    const writeSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

    await create.run([guideName]);

    const [[, content]] = writeSpy.mock.calls;
    expect(content).toMatchSnapshot();
  });
});
