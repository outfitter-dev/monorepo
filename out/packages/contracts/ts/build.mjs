#!/usr/bin/env bun

// Bun build script for @outfitter/contracts
// Replaces tsup with native Bun build for improved performance

import { $ } from 'bun';

const entryPoints = [
  'src/index.ts',
  'src/error.ts',
  'src/result.ts',
  'src/assert.ts',
  'src/types/index.ts',
  'src/types/branded.ts',
];

const zodEntryPoints = [
  'src/zod/index.ts',
];

console.log('Building with Bun...');

// Clean dist directory
await $`rm -rf dist`;
await $`mkdir -p dist/types dist/zod`;

// Build all entry points with Bun
const result = await Bun.build({
  entrypoints: entryPoints,
  outdir: './dist',
  format: 'esm',
  sourcemap: 'external',
  splitting: false, // Matches tsup config
  minify: false,
  target: 'node',
});

if (!result.success) {
  console.error('Build failed:');
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

console.log('✓ Core build complete');

// Compile Zod files with TypeScript (handles peer dependencies better)
console.log('Compiling Zod extensions with TypeScript...');
try {
  // Compile just the zod files to JS
  await $`../../../node_modules/.bin/tsc src/zod/index.ts src/zod/env.ts src/zod/error.ts --outDir dist --target es2022 --module es2022 --moduleResolution bundler --esModuleInterop --allowSyntheticDefaultImports --strict --skipLibCheck`;
  console.log('✓ Zod JS compilation complete');
} catch (error) {
  console.warn('Warning: Could not compile Zod JS files:', error.message);
}

// Generate TypeScript declarations for all files
console.log('Generating TypeScript declarations...');
await $`../../../node_modules/.bin/tsc --emitDeclarationOnly`;

console.log('✓ Build complete');
