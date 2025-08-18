/*
---

slug: testing-jest-config
title: Jest 29+ configuration with TypeScript and coverage
description: Modern Jest configuration template for TypeScript projects with comprehensive coverage.
type: template
---

*/
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

const config = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  // Test environment configuration
  testEnvironment: 'node',
  testEnvironmentOptions: {
    // For jsdom environment (React apps)
    // url: '<http://localhost>',
  },
  // Test file locations
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/**tests**/**/*.(test|spec).(ts|tsx|js|jsx)',
    '**/*.(test|spec).(ts|tsx|js|jsx)',
  ],
  // Module resolution
  moduleNameMapper: {
    // Handle path aliases from tsconfig
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    // Handle CSS imports (for React apps)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle static assets
    '\\.(jpg|jpeg|png|gif|svg|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/tests/**mocks**/fileMock.js',
  },
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx', // or 'react' for older React versions
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
        // Improve performance
        isolatedModules: true,
      },
    ],
  },
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/globalTeardown.ts',
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts', // Exclude barrel exports
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Per-file thresholds
    './src/utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageDirectory: '<rootDir>/coverage',
  // Performance and optimization
  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  // Error handling
  errorOnDeprecated: true,
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '\\.e2e\\.test\\.(ts|tsx|js|jsx)$',
  ],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/build/'],
  // Watch mode configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  // Snapshot configuration
  snapshotSerializers: [
    '@emotion/jest/serializer', // If using Emotion
    // 'jest-serializer-html', // If testing HTML output
  ],
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname} - {title}',
        titleTemplate: '{classname} - {title}',
        ancestorSeparator: ' › ',
      },
    ],
  ],
  // Miscellaneous
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,
  resetModules: false,
  // TypeScript specific
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Timeout configuration
  testTimeout: 10_000, // 10 seconds
  // Verbose output
  verbose: process.env.CI === 'true',
};
export default config;
// Example setup.ts file content:
/*
// tests/setup.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { server } from './mocks/server';

// Configure Testing Library
configure({ testIdAttribute: 'data-testid' });

// Start MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
*/
// Example globalSetup.ts file content:
/*
// tests/globalSetup.ts
export default async function globalSetup() {
  // Set up test database, start services, etc.
  process.env.NODE_ENV = 'test';
  process.env.TZ = 'UTC';
}
*/
//# sourceMappingURL=testing-jest-config.js.map
