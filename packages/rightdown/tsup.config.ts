import { defineConfig } from 'tsup';

export default defineConfig([
  // Main build config for library and CLI
  {
    entry: {
      index: 'src/index.ts',
      cli: 'src/cli.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    shims: true,
  },
  // Separate config for custom rules and utilities (CommonJS only for markdownlint compatibility)
  {
    entry: {
      'rules/consistent-terminology': 'src/rules/consistent-terminology.ts',
      'utils/validation': 'src/utils/validation.ts',
    },
    format: ['cjs'],
    dts: false,
    sourcemap: false,
    clean: false, // Don't clean since we're building into the same dist
    shims: false,
    target: 'node14',
    outDir: 'dist',
  },
]);
