import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/types/**',
        'src/cli.ts', // CLI entry point
        'src/index.ts', // Just exports
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        // Critical paths require 90%
        perFile: {
          'src/core/*.ts': {
            lines: 90,
            functions: 90,
            branches: 90,
            statements: 90,
          },
        },
      },
    },
  },
});