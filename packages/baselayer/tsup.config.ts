import { defineConfig } from 'tsup';

export default defineConfig([
  // Main library build
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: false, // Disabled until type issues are fixed
    clean: true,
    sourcemap: true,
    tsconfig: './tsconfig.json',
    shims: true,
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.js' : '.cjs',
      };
    },
  },
  // CLI build (with shebang)
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    clean: false, // Don't clean since we're building multiple configs
    sourcemap: true,
    tsconfig: './tsconfig.json',
    shims: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
    outExtension() {
      return {
        js: '.js',
      };
    },
  },
]);
