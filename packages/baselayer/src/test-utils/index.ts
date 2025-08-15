import type { Mock } from 'vitest';
import { vi } from 'vitest';

export interface MockFileSystem {
  '/package.json': string;
  [key: string]: string;
}

export interface MockExecResult {
  stdout: string;
  stderr: string;
}

export interface TestContext {
  mockFs: MockFileSystem;
  mockExec: Mock<[string], MockExecResult>;
  mockConsole: {
    log: Mock;
    error: Mock;
    warn: Mock;
  };
}

/**
 * Create a mock file system for testing
 */
export function createMockFileSystem(files: MockFileSystem): MockFileSystem {
  return { ...files };
}

// Global state for mocks that need to be hoisted
const globalMockState = {
  mockFs: {} as MockFileSystem,
  mockExec: vi.fn<[string], MockExecResult>(),
};

// Mock modules at the top level (hoisted)
vi.mock('node:fs', () => ({
  existsSync: vi.fn((path: string) => path in globalMockState.mockFs),
  readFileSync: vi.fn((path: string) => {
    if (!(path in globalMockState.mockFs)) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return globalMockState.mockFs[path];
  }),
  writeFileSync: vi.fn((path: string, content: string) => {
    globalMockState.mockFs[path] = content;
  }),
  mkdirSync: vi.fn(),
  rmSync: vi.fn((path: string) => {
    delete globalMockState.mockFs[path];
  }),
  readdirSync: vi.fn((dir: string) => {
    const prefix = dir.endsWith('/') ? dir : `${dir}/`;
    return Object.keys(globalMockState.mockFs)
      .filter((path) => path.startsWith(prefix))
      .map((path) => path.slice(prefix.length).split('/')[0])
      .filter((name, index, arr) => arr.indexOf(name) === index);
  }),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(async (path: string) => {
    if (!(path in globalMockState.mockFs)) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return globalMockState.mockFs[path];
  }),
  writeFile: vi.fn(async (path: string, content: string) => {
    globalMockState.mockFs[path] = content;
  }),
  mkdir: vi.fn(),
  rm: vi.fn(async (path: string) => {
    delete globalMockState.mockFs[path];
  }),
  access: vi.fn(async (path: string) => {
    if (!(path in globalMockState.mockFs)) {
      throw new Error(`ENOENT: no such file or directory, access '${path}'`);
    }
  }),
}));

vi.mock('node:child_process', () => ({
  execSync: vi.fn((cmd: string) => globalMockState.mockExec(cmd)),
}));

// Mock glob
vi.mock('glob', () => ({
  glob: vi.fn(async () => []),
}));

// Mock the file-system utility
vi.mock('../utils/file-system.js', () => ({
  findFiles: vi.fn(async () => ({ success: true, data: [] })),
  fileExists: vi.fn(async () => ({ success: true, data: false })),
  readFile: vi.fn(async () => ({ success: true, data: '' })),
  writeFile: vi.fn(async () => ({ success: true, data: undefined })),
  createDirectory: vi.fn(async () => ({ success: true, data: undefined })),
  copyFile: vi.fn(async () => ({ success: true, data: undefined })),
  deleteFile: vi.fn(async () => ({ success: true, data: undefined })),
}));

vi.mock('node:path', async () => {
  const actual = await vi.importActual<typeof import('node:path')>('node:path');
  return {
    ...actual,
    join: (...args: string[]) => {
      const filtered = args.filter(Boolean);
      let result = filtered.join('/');
      // Clean up double slashes
      result = result.replace(/\/+/g, '/');
      return result;
    },
    resolve: (...args: string[]) => {
      const joined = args.filter(Boolean).join('/');
      let result = joined.startsWith('/') ? joined : `/${joined}`;
      // Clean up double slashes
      result = result.replace(/\/+/g, '/');
      return result;
    },
  };
});

/**
 * Create a test context with common mocks
 */
export function createTestContext(
  initialFiles: MockFileSystem = {}
): TestContext {
  // Reset and setup mock filesystem
  globalMockState.mockFs = createMockFileSystem(initialFiles);
  globalMockState.mockExec = vi.fn<[string], MockExecResult>();

  const mockConsole = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };

  // Mock process.cwd() to return root for mock filesystem
  vi.spyOn(process, 'cwd').mockReturnValue('/');

  return {
    mockFs: globalMockState.mockFs,
    mockExec: globalMockState.mockExec,
    mockConsole,
  };
}

/**
 * Create a basic package.json for testing
 */
export function createPackageJson(overrides: Record<string, any> = {}): string {
  const packageJson = {
    name: 'test-project',
    version: '1.0.0',
    type: 'module',
    scripts: {
      test: 'vitest',
    },
    devDependencies: {},
    ...overrides,
  };
  return JSON.stringify(packageJson, null, 2);
}

/**
 * Create ESLint config for testing
 */
export function createEslintConfig(): string {
  return JSON.stringify(
    {
      extends: ['eslint:recommended'],
      rules: {
        semi: ['error', 'always'],
      },
    },
    null,
    2
  );
}

/**
 * Create Prettier config for testing
 */
export function createPrettierConfig(): string {
  return JSON.stringify(
    {
      semi: false,
      singleQuote: true,
      tabWidth: 2,
    },
    null,
    2
  );
}

/**
 * Mock prompts for interactive testing
 */
export function mockPrompts(responses: Record<string, any>) {
  vi.mock('@inquirer/prompts', () => ({
    confirm: vi.fn(async ({ message }: { message: string }) => {
      const key = Object.keys(responses).find((k) => message.includes(k));
      return key ? responses[key] : false;
    }),
    select: vi.fn(
      async ({ message, choices }: { message: string; choices: any[] }) => {
        const key = Object.keys(responses).find((k) => message.includes(k));
        return key ? responses[key] : choices[0].value;
      }
    ),
    checkbox: vi.fn(
      async ({ message, choices }: { message: string; choices: any[] }) => {
        const key = Object.keys(responses).find((k) => message.includes(k));
        if (key && Array.isArray(responses[key])) {
          return responses[key];
        }
        // Return default checked items
        return choices.filter((c) => c.checked).map((c) => c.value);
      }
    ),
    input: vi.fn(
      async ({
        message,
        defaultValue,
      }: {
        message: string;
        defaultValue?: string;
      }) => {
        const key = Object.keys(responses).find((k) => message.includes(k));
        return key ? responses[key] : defaultValue || '';
      }
    ),
  }));
}

/**
 * Reset all mocks
 */
export function resetMocks() {
  vi.resetAllMocks();
  vi.resetModules();
}
