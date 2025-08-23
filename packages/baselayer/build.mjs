#!/usr/bin/env bun
import { existsSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const distDir = resolve('dist');

// Clean dist directory
if (existsSync(distDir)) {
  console.log('Cleaning dist directory...');
  rmSync(distDir, { recursive: true, force: true });
}

// Build main library
console.log('Building main library...');
const mainBuild = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  format: 'esm',
  target: 'node',
  splitting: true,
  sourcemap: 'external',
  minify: false,
  external: ['@outfitter/contracts'],
});

if (!mainBuild.success) {
  console.error('Build failed:\n' + mainBuild.logs.map(l => `${l.level?.toUpperCase() ?? 'LOG'}: ${l.message}`).join('\n'));
  process.exit(1);
}

// Build CJS version
console.log('Building CJS version...');
const cjsBuild = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  format: 'cjs',
  target: 'node',
  splitting: false,
  sourcemap: 'external',
  minify: false,
  naming: '[dir]/[name].cjs',
  external: ['@outfitter/contracts'],
});

if (!cjsBuild.success) {
  console.error('CJS build failed:\n' + cjsBuild.logs.map(l => `${l.level?.toUpperCase() ?? 'LOG'}: ${l.message}`).join('\n'));
  process.exit(1);
}

// Build CLI with shebang
console.log('Building CLI...');
const cliBuild = await Bun.build({
  entrypoints: ['./src/cli.ts'],
  outdir: './dist',
  format: 'esm',
  target: 'node',
  splitting: false,
  sourcemap: 'external',
  minify: false,
  external: ['@outfitter/contracts'],
});

if (!cliBuild.success) {
  console.error('CLI build failed:\n' + cliBuild.logs.map(l => `${l.level?.toUpperCase() ?? 'LOG'}: ${l.message}`).join('\n'));
  process.exit(1);
}

// Add shebang to CLI file
const cliPath = resolve('dist/cli.js');
if (existsSync(cliPath)) {
  const cliContent = await Bun.file(cliPath).text();
  await Bun.write(cliPath, '#!/usr/bin/env node\n' + cliContent);
  // Make executable
  execSync(`chmod +x ${cliPath}`);
}

// Generate TypeScript declarations
console.log('Generating TypeScript declarations...');
try {
  execSync('bunx tsc --emitDeclarationOnly --project tsconfig.json', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to generate TypeScript declarations:', error);
  process.exit(1);
}

console.log('✅ Build complete!');