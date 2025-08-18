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
  mockExec: Mock;
  mockConsole: {
    log: Mock;
    error: Mock;
    warn: Mock;
  };
}

/**

- Create a mock file system for testing
 */
export function createMockFileSystem(files: MockFileSystem): MockFileSystem {
  return { ...files };
}

/**

- Set up mocks for a test. Call this in beforeEach.
 */
export function setupMocks() {
  // Mock modules that are commonly used
  const mockState = {
    mockFs: {} as MockFileSystem,
    mockExec: vi.fn(),
  };

  // Return mock functions that can be configured per test
  return {
    mockState,
    setupFileMocks: (files: MockFileSystem) => {
      mockState.mockFs = files;

      // Mock fs methods
      vi.mocked = vi.mocked || ((fn: unknown) => fn);

      // Create spies for fs operations
      const mockExists = vi.fn((path: string) => path in mockState.mockFs);
      const mockReadFile = vi.fn((path: string) => {
        if (!(path in mockState.mockFs)) {
          throw new Error(`ENOENT: no such file or directory, open '${path}'`);
        }
        return mockState.mockFs[path];
      });
      const mockWriteFile = vi.fn((path: string, content: string) => {
        mockState.mockFs[path] = content;
      });

      return { mockExists, mockReadFile, mockWriteFile };
    },
  };
}

/**

- Create a test context with common mocks
 */
export function createTestContext(
  initialFiles: MockFileSystem = { '/package.json': '{}' }
): TestContext {
  const mockFs = createMockFileSystem(initialFiles);
  const mockExec = vi.fn();

  const mockConsole = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };

  // Mock process.cwd() to return root for mock filesystem
  vi.spyOn(process, 'cwd').mockReturnValue('/');

  return {
    mockFs,
    mockExec,
    mockConsole,
  };
}

/**

- Create a basic package.json for testing
 */
export function createPackageJson(
  overrides: Record<string, unknown> = {}
): string {
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

- Create ESLint config for testing
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

- Create Prettier config for testing
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

interface Choice {
  value: unknown;
  checked?: boolean;
}

/**

- Mock prompts for interactive testing
 */
export function mockPrompts(responses: Record<string, unknown>) {
  const mockConfirm = vi.fn(async ({ message }: { message: string }) => {
    const key = Object.keys(responses).find((k) => message.includes(k));
    return key ? responses[key] : false;
  });

  const mockSelect = vi.fn(
    async ({ message, choices }: { message: string; choices: Choice[] }) => {
      const key = Object.keys(responses).find((k) => message.includes(k));
      return key ? responses[key] : choices[0]?.value;
    }
  );

  const mockCheckbox = vi.fn(
    async ({ message, choices }: { message: string; choices: Choice[] }) => {
      const key = Object.keys(responses).find((k) => message.includes(k));
      if (key && Array.isArray(responses[key])) {
        return responses[key];
      }
      // Return default checked items
      return choices.filter((c) => c.checked).map((c) => c.value);
    }
  );

  const mockInput = vi.fn(
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
  );

  return {
    confirm: mockConfirm,
    select: mockSelect,
    checkbox: mockCheckbox,
    input: mockInput,
  };
}

/**

- Reset all mocks
 */
export function resetMocks() {
  vi.resetAllMocks();
  vi.resetModules();
}
