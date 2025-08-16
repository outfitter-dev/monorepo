import {
  ErrorCode,
  failure,
  isFailure,
  isSuccess,
  success,
} from '@outfitter/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from '../../utils/file-system';
import {
  detectEslintConfig,
  detectExistingTools,
  detectGitHooks,
  detectMarkdown,
  detectPrettierConfig,
  detectReact,
  detectStyles,
  detectTypeScript,
  detectVSCode,
  getConfigsToCleanup,
} from '../detector';

describe('detector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock file system functions
    vi.spyOn(fs, 'fileExists').mockImplementation(vi.fn());
    vi.spyOn(fs, 'readFile').mockImplementation(vi.fn());
    vi.spyOn(fs, 'readJSON').mockImplementation(vi.fn());
    vi.spyOn(fs, 'findFiles').mockImplementation(vi.fn());
  });

  describe('detectExistingTools', () => {
    it('should detect ESLint configuration files', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (filePath) =>
        success(filePath.endsWith('.eslintrc.json'))
      );

      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        if (filePath.endsWith('.eslintrc.json')) {
          return success('{"extends": ["standard"]}');
        }
        return failure({
          type: 'FILE_SYSTEM_ERROR',
          code: 'ENOENT',
          message: 'Not found',
        });
      });

      const result = await detectExistingTools();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.hasConfigs).toBe(true);
        expect(result.data.tools.has('eslint')).toBe(true);
        expect(result.data.configs).toHaveLength(1);
        expect(result.data.configs[0]).toEqual({
          tool: 'eslint',
          path: '.eslintrc.json',
          content: '{"extends": ["standard"]}',
        });
      }
    });

    it('should detect multiple configuration files', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (filePath) =>
        success(
          filePath.endsWith('.eslintrc.json') ||
            filePath.endsWith('.prettierrc')
        )
      );

      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        if (filePath.endsWith('.eslintrc.json')) {
          return success('{"extends": ["standard"]}');
        }
        if (filePath.endsWith('.prettierrc')) {
          return success('{"semi": false}');
        }
        return failure({
          type: 'FILE_SYSTEM_ERROR',
          code: 'ENOENT',
          message: 'Not found',
        });
      });

      const result = await detectExistingTools();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.hasConfigs).toBe(true);
        expect(result.data.tools.size).toBe(2);
        expect(result.data.tools.has('eslint')).toBe(true);
        expect(result.data.tools.has('prettier')).toBe(true);
        expect(result.data.configs).toHaveLength(2);
      }
    });

    it('should detect embedded configs in package.json', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));

      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        if (filePath.endsWith('package.json')) {
          return success(
            JSON.stringify({
              name: 'test-project',
              eslintConfig: {
                extends: ['standard'],
              },
              prettier: {
                semi: false,
              },
            })
          );
        }
        return failure({
          type: 'FILE_SYSTEM_ERROR',
          code: 'ENOENT',
          message: 'Not found',
        });
      });

      const result = await detectExistingTools();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.hasConfigs).toBe(true);
        expect(result.data.tools.size).toBe(2);
        expect(result.data.configs).toHaveLength(2);
        expect(result.data.configs[0].path).toBe('package.json');
        expect(result.data.configs[1].path).toBe('package.json');
      }
    });

    it('should handle no configurations found', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));

      vi.mocked(fs.readFile).mockResolvedValue(
        failure({
          type: 'FILE_SYSTEM_ERROR',
          code: 'ENOENT',
          message: 'Not found',
        })
      );

      const result = await detectExistingTools();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.hasConfigs).toBe(false);
        expect(result.data.tools.size).toBe(0);
        expect(result.data.configs).toHaveLength(0);
      }
    });

    it('should handle invalid package.json', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));

      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        if (filePath.endsWith('package.json')) {
          return success('invalid json');
        }
        return failure({
          type: 'FILE_SYSTEM_ERROR',
          code: 'ENOENT',
          message: 'Not found',
        });
      });

      const result = await detectExistingTools();

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.message).toContain('Failed to parse package.json');
      }
    });
  });

  describe('detectEslintConfig', () => {
    it('should return true when ESLint is configured', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (filePath) =>
        success(filePath.endsWith('.eslintrc.js'))
      );

      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        if (filePath.endsWith('.eslintrc.js')) {
          return success('module.exports = {};');
        }
        return failure({
          type: 'FILE_SYSTEM_ERROR',
          code: 'ENOENT',
          message: 'Not found',
        });
      });

      const result = await detectEslintConfig();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false when ESLint is not configured', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));

      vi.mocked(fs.readFile).mockResolvedValue(
        failure({
          type: 'FILE_SYSTEM_ERROR',
          code: 'ENOENT',
          message: 'Not found',
        })
      );

      const result = await detectEslintConfig();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('detectPrettierConfig', () => {
    it('should return true when Prettier is configured', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (filePath) =>
        success(filePath.endsWith('.prettierrc.json'))
      );

      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        if (filePath.endsWith('.prettierrc.json')) {
          return success('{"semi": false}');
        }
        return failure({
          type: 'FILE_SYSTEM_ERROR',
          code: 'ENOENT',
          message: 'Not found',
        });
      });

      const result = await detectPrettierConfig();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(true);
      }
    });
  });

  describe('detectTypeScript', () => {
    it('should return true when tsconfig.json exists', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (filePath) =>
        success(filePath.endsWith('tsconfig.json'))
      );

      const result = await detectTypeScript();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(true);
      }
    });

    it('should return true when TypeScript files exist', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));

      vi.mocked(fs.findFiles).mockResolvedValue(
        success(['src/index.ts', 'src/component.tsx'])
      );

      const result = await detectTypeScript();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false when no TypeScript is detected', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));

      vi.mocked(fs.findFiles).mockResolvedValue(success([]));

      const result = await detectTypeScript();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('detectReact', () => {
    it('should return true when React is in dependencies', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        success(
          JSON.stringify({
            dependencies: {
              react: '^18.0.0',
              'react-dom': '^18.0.0',
            },
          })
        )
      );

      const result = await detectReact();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(true);
      }
    });

    it('should return true when React is in devDependencies', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        success(
          JSON.stringify({
            devDependencies: {
              react: '^18.0.0',
            },
          })
        )
      );

      const result = await detectReact();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false when React is not found', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        success(
          JSON.stringify({
            dependencies: {
              express: '^4.0.0',
            },
          })
        )
      );

      const result = await detectReact();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(false);
      }
    });

    it('should return false when package.json is not found', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        failure({
          type: 'FILE_SYSTEM_ERROR',
          code: 'ENOENT',
          message: 'Not found',
        })
      );

      const result = await detectReact();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('detectStyles', () => {
    it('should return true when style files exist', async () => {
      vi.mocked(fs.findFiles).mockResolvedValue(
        success(['src/styles.css', 'src/main.scss'])
      );

      const result = await detectStyles();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false when no style files exist', async () => {
      vi.mocked(fs.findFiles).mockResolvedValue(success([]));

      const result = await detectStyles();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('detectMarkdown', () => {
    it('should return true when markdown files exist', async () => {
      vi.mocked(fs.findFiles).mockResolvedValue(
        success(['README.md', 'docs/guide.mdx'])
      );

      const result = await detectMarkdown();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false when no markdown files exist', async () => {
      vi.mocked(fs.findFiles).mockResolvedValue(success([]));

      const result = await detectMarkdown();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('detectVSCode', () => {
    it('should return true when .vscode directory exists', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(true));

      const result = await detectVSCode();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false when .vscode directory does not exist', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));

      const result = await detectVSCode();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('detectGitHooks', () => {
    it('should detect husky', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (filePath) =>
        success(filePath.endsWith('.husky'))
      );

      const result = await detectGitHooks();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('husky');
      }
    });

    it('should detect lefthook', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (filePath) =>
        success(filePath.endsWith('lefthook.yml'))
      );

      const result = await detectGitHooks();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('lefthook');
      }
    });

    it('should detect simple-git-hooks in package.json', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));

      vi.mocked(fs.readFile).mockResolvedValue(
        success(
          JSON.stringify({
            'simple-git-hooks': {
              'pre-commit': 'npm test',
            },
          })
        )
      );

      const result = await detectGitHooks();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('simple-git-hooks');
      }
    });

    it('should return null when no git hooks detected', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));

      vi.mocked(fs.readFile).mockResolvedValue(success(JSON.stringify({})));

      const result = await detectGitHooks();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(null);
      }
    });
  });

  describe('getConfigsToCleanup', () => {
    it('should return list of existing config files', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (filePath) =>
        success(
          filePath.endsWith('.eslintrc.json') ||
            filePath.endsWith('.prettierrc')
        )
      );

      const result = await getConfigsToCleanup();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toContain('.eslintrc.json');
        expect(result.data).toContain('.prettierrc');
      }
    });

    it('should return empty array when no configs exist', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));

      const result = await getConfigsToCleanup();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toHaveLength(0);
      }
    });
  });
});
