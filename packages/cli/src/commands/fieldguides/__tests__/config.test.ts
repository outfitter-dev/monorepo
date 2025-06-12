/**
 * Test suite uses Jest (ts-jest) which is the standard framework in the repo.
 * fs, path and process.cwd are mocked with jest.spyOn to isolate behaviour.
 */

import path from 'node:path';
import * as fs from 'node:fs';
import * as configModule from '../config.js';
const { loadConfig, validateConfig, findConfigPath } = configModule;

describe('config utilities', () => {
  const mockConfig = { title: 'My FG', steps: [] };

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  describe('findConfigPath', () => {
    it('returns path when config exists in cwd', () => {
      const cwd = '/project';
      jest.spyOn(process, 'cwd').mockReturnValue(cwd);
      const expected = path.join(cwd, 'fieldguide.config.json');
      jest.spyOn(fs, 'existsSync').mockImplementation(p => p === expected);
      expect(findConfigPath()).toBe(expected);
    });

    it('searches ancestor directories and returns first found', () => {
      const cwd = '/project/sub';
      jest.spyOn(process, 'cwd').mockReturnValue(cwd);
      const existsMap: Record<string, boolean> = {
        [path.join(cwd, 'fieldguide.config.json')]: false,
        [path.join('/project', 'fieldguide.config.json')]: true,
      };
      jest
        .spyOn(fs, 'existsSync')
        .mockImplementation(p => !!existsMap[p as string]);
      expect(findConfigPath()).toBe(
        path.join('/project', 'fieldguide.config.json')
      );
    });

    it('throws error when config is not found', () => {
      jest.spyOn(process, 'cwd').mockReturnValue('/nowhere');
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      expect(() => findConfigPath()).toThrow(/Configuration file not found/);
    });
  });

  describe('validateConfig', () => {
    it('does not throw for valid config', () => {
      expect(() => validateConfig(mockConfig)).not.toThrow();
    });

    it('throws error for invalid config schema', () => {
      // @ts-expect-error invalid property types
      const invalidConfig = { title: 123, steps: 'not-an-array' };
      expect(() => validateConfig(invalidConfig)).toThrow(
        /Invalid configuration/
      );
    });
  });

  describe('loadConfig', () => {
    const filePath = '/project/fieldguide.config.json';

    it('returns parsed JSON for valid file', () => {
      jest.spyOn(configModule, 'findConfigPath').mockReturnValue(filePath);
      jest
        .spyOn(fs, 'readFileSync')
        .mockReturnValue(JSON.stringify(mockConfig));
      expect(loadConfig()).toEqual(mockConfig);
    });

    it('throws on invalid JSON', () => {
      jest.spyOn(configModule, 'findConfigPath').mockReturnValue(filePath);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('not valid json');
      expect(() => loadConfig()).toThrow(/Unexpected token/);
    });

    it('throws when config file is missing', () => {
      jest.spyOn(configModule, 'findConfigPath').mockImplementation(() => {
        throw new Error('Configuration file not found');
      });
      expect(() => loadConfig()).toThrow(/Configuration file not found/);
    });

    it('handles file system errors gracefully', () => {
      jest.spyOn(configModule, 'findConfigPath').mockReturnValue(filePath);
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });
      expect(() => loadConfig()).toThrow(/permission denied/);
    });
  });
});
