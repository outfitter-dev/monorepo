# !/usr/bin/env bun

// Bun build script for @outfitter/contracts
// Replaces tsup with native Bun build for improved performance

import { $ } from 'bun';
import { glob } from 'glob';
import fs from 'fs';

const entryPoints = [
  'src/index.ts',
  'src/error.ts',
  'src/result.ts',
  'src/assert.ts',
  'src/types/index.ts',
  'src/types/branded.ts',
];

const _zodEntryPoints = ['src/zod/index.ts'];

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

// Fix TypeScript declaration imports to use .d.ts extensions instead of .js
console.log('Fixing declaration file imports...');

const declarationFiles = await glob('./dist/**/*.d.ts');
for (const file of declarationFiles) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace .js extensions with .d.ts in import statements
  // Patterns to match: from './file.js', from "./file.js", from './path/file.js'
  content = content.replace(
    /(from\s+['"]\.[^'"]*?)\.js(['"])/g,
    '$1$2'
  );
  
  // Replace export *from './file.js' with export* from './file'
  content = content.replace(
    /(export\s+\*\s+from\s+['"]\.[^'"]*?)\.js(['"])/g,
    '$1$2'
  );
  
  fs.writeFileSync(file, content);
}

console.log('✓ Build complete');
