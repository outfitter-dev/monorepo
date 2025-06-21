import { describe, test, expect, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Package Exports Integration', () => {
  // __dirname is <pkgRoot>/src/__tests__
  // walk two levels up to reach the package root (where package.json lives)
  const packageRoot = join(__dirname, '..', '..');
  const distDir = join(packageRoot, 'dist');

  beforeAll(() => {
    // Skip build in CI - rely on top-level build job
    if (process.env.CI === 'true') {
      return;
    }

    // Ensure the package is built for local development
    if (!existsSync(distDir)) {
      console.log('Building package for export tests...');
      execSync('pnpm build', { cwd: packageRoot, stdio: 'inherit' });
    }
  });

  describe('Sub-path exports via package.json exports field', () => {
    test('root export should work', async () => {
      // Use dynamic import to test actual module resolution
      const rootModule = await import('@outfitter/contracts');

      expect(rootModule.makeError).toBeDefined();
      expect(rootModule.success).toBeDefined();
      expect(rootModule.failure).toBeDefined();
      expect(rootModule.assert).toBeDefined();
    });

    test('/error export should work', async () => {
      const errorModule = await import('@outfitter/contracts/error');

      expect(errorModule.makeError).toBeDefined();
      expect(errorModule.isAppError).toBeDefined();
      expect(errorModule.toAppError).toBeDefined();
      expect(errorModule.ErrorCode).toBeDefined();
      expect(errorModule.ErrorCategory).toBeDefined();
      expect(errorModule.isErrorInCategory).toBeDefined();
    });

    test('/result export should work', async () => {
      const resultModule = await import('@outfitter/contracts/result');

      expect(resultModule.success).toBeDefined();
      expect(resultModule.failure).toBeDefined();
      expect(resultModule.isSuccess).toBeDefined();
      expect(resultModule.isFailure).toBeDefined();
      expect(resultModule.map).toBeDefined();
      expect(resultModule.mapError).toBeDefined();
      expect(resultModule.flatMap).toBeDefined();
      expect(resultModule.all).toBeDefined();
      expect(resultModule.unwrap).toBeDefined();
      expect(resultModule.unwrapOr).toBeDefined();
      expect(resultModule.getOrElse).toBeDefined();
    });

    test('/assert export should work', async () => {
      const assertModule = await import('@outfitter/contracts/assert');

      expect(assertModule.assert).toBeDefined();
      expect(assertModule.assertDefined).toBeDefined();
      expect(assertModule.assertNever).toBeDefined();
    });

    test('/branded export should work', async () => {
      const brandedModule = await import('@outfitter/contracts/branded');

      expect(brandedModule.createUserId).toBeDefined();
      expect(brandedModule.createEmail).toBeDefined();
      expect(brandedModule.createNonEmptyString).toBeDefined();
      expect(brandedModule.isUserId).toBeDefined();
      expect(brandedModule.isEmail).toBeDefined();
      expect(brandedModule.createBrandedType).toBeDefined();
    });

    test('/types export should work', async () => {
      const typesModule = await import('@outfitter/contracts/types');

      // Types module re-exports from branded, so we check some functions
      expect(typesModule.createUserId).toBeDefined();
      expect(typesModule.createEmail).toBeDefined();

      // Note: Pure type exports like DeepReadonly can't be tested at runtime
      // but the module should at least resolve without error
    });
  });

  describe('Export functionality', () => {
    test('exported functions should work correctly', async () => {
      const { makeError, ErrorCode } = await import('@outfitter/contracts/error');
      const { success, failure, isSuccess } = await import('@outfitter/contracts/result');
      const { assert } = await import('@outfitter/contracts/assert');

      // Test error creation
      const error = makeError(ErrorCode.VALIDATION_ERROR, 'Test error');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Test error');

      // Test result pattern
      const successResult = success('test');
      expect(isSuccess(successResult)).toBe(true);
      expect(successResult.data).toBe('test');

      const failureResult = failure(error);
      expect(isSuccess(failureResult)).toBe(false);

      // Test assertion
      expect(() => assert(true, 'Should not throw')).not.toThrow();
      expect(() => assert(false, 'Should throw')).toThrow('Should throw');
    });
  });

  describe('TypeScript type imports', () => {
    test('type imports should compile without errors', () => {
      // This test validates that our .d.ts files are correctly placed
      // The actual compilation happens at build time, so we just verify
      // the declaration files exist

      const declarationFiles = [
        'dist/index.d.ts',
        'dist/error.d.ts',
        'dist/result.d.ts',
        'dist/assert.d.ts',
        'dist/types/index.d.ts',
        'dist/types/branded.d.ts',
      ];

      for (const file of declarationFiles) {
        const fullPath = join(packageRoot, file);
        expect(existsSync(fullPath), `Missing declaration file: ${file}`).toBe(true);
      }
    });
  });
});
