#!/usr/bin/env bun
/**
 * Pre-commit validation script
 * Runs comprehensive checks on staged files to catch issues before they reach code review
 */

import { $ } from 'bun';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { Result, success, failure, makeError } from '@outfitter/contracts';

interface ValidationResult {
  file: string;
  errors: Array<{
    line?: number;
    column?: number;
    severity: 'error' | 'warning';
    message: string;
    rule?: string;
  }>;
}

interface FileValidation {
  path: string;
  content: string;
  lines: Array<string>;
}

/**
 * Get list of staged files
 */
async function getStagedFiles(): Promise<Result<Array<string>, Error>> {
  try {
    const result = await $`git diff --cached --name-only --diff-filter=ACM`.text();
    const files = result
      .trim()
      .split('\n')
      .filter((f) => f.length > 0)
      .filter((f) => {
        const ext = extname(f);
        return ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext);
      });
    
    return success(files);
  } catch (error) {
    return failure(makeError('GIT_ERROR', `Failed to get staged files: ${error}`));
  }
}

/**
 * Load and prepare file for validation
 */
function loadFile(filePath: string): Result<FileValidation, Error> {
  try {
    if (!existsSync(filePath)) {
      return failure(makeError('FILE_NOT_FOUND', `File not found: ${filePath}`));
    }
    
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    return success({
      path: filePath,
      content,
      lines,
    });
  } catch (error) {
    return failure(makeError('FILE_READ_ERROR', `Failed to read file ${filePath}: ${error}`));
  }
}

/**
 * Check for Result pattern usage without proper error handling
 */
function validateResultPattern(file: FileValidation): Array<ValidationResult['errors'][0]> {
  const errors: Array<ValidationResult['errors'][0]> = [];
  const resultPattern = /\b(success|failure|makeError)\b/g;
  
  file.lines.forEach((line, index) => {
    if (resultPattern.test(line)) {
      // Check if Result import is present
      const hasResultImport = file.content.includes("from '@outfitter/contracts'");
      if (!hasResultImport && !file.path.includes('packages/contracts')) {
        errors.push({
          line: index + 1,
          severity: 'error',
          message: 'Using Result pattern without importing from @outfitter/contracts',
          rule: 'result-pattern-import',
        });
      }
      
      // Check for unhandled Results
      if (line.includes('success(') || line.includes('failure(')) {
        const functionContext = file.lines.slice(Math.max(0, index - 5), index).join('\n');
        if (!functionContext.includes(': Result<')) {
          errors.push({
            line: index + 1,
            severity: 'warning',
            message: 'Function using Result pattern should have explicit Result return type',
            rule: 'result-return-type',
          });
        }
      }
    }
  });
  
  return errors;
}

/**
 * Check for missing type annotations
 */
function validateTypeAnnotations(file: FileValidation): Array<ValidationResult['errors'][0]> {
  const errors: Array<ValidationResult['errors'][0]> = [];
  
  // Skip test files for some checks
  const isTestFile = file.path.includes('.test.') || file.path.includes('.spec.');
  
  file.lines.forEach((line, index) => {
    // Check for any type
    if (line.includes(': any') && !line.includes('// biome-ignore')) {
      errors.push({
        line: index + 1,
        severity: 'error',
        message: 'Avoid using "any" type. Use specific types or unknown.',
        rule: 'no-any',
      });
    }
    
    // Check for missing return types
    const functionPattern = /^(export\s+)?(async\s+)?function\s+\w+\s*\([^)]*\)\s*{/;
    const arrowFunctionPattern = /^(export\s+)?const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>\s*{/;
    
    if ((functionPattern.test(line) || arrowFunctionPattern.test(line)) && !isTestFile) {
      if (!line.includes(':') || line.indexOf(':') > line.indexOf('{')) {
        errors.push({
          line: index + 1,
          severity: 'warning',
          message: 'Function is missing explicit return type annotation',
          rule: 'explicit-return-type',
        });
      }
    }
    
    // Check for untyped parameters
    const paramPattern = /\(([^)]+)\)/;
    const match = line.match(paramPattern);
    if (match && match[1] && !isTestFile) {
      const params = match[1].split(',');
      params.forEach((param) => {
        const trimmed = param.trim();
        if (trimmed && !trimmed.includes(':') && !trimmed.includes('=') && !trimmed.includes('...')) {
          errors.push({
            line: index + 1,
            severity: 'error',
            message: `Parameter "${trimmed}" is missing type annotation`,
            rule: 'untyped-parameter',
          });
        }
      });
    }
  });
  
  return errors;
}

/**
 * Check for security issues
 */
function validateSecurity(file: FileValidation): Array<ValidationResult['errors'][0]> {
  const errors: Array<ValidationResult['errors'][0]> = [];
  
  file.lines.forEach((line, index) => {
    // Check for eval usage
    if (line.includes('eval(') && !line.includes('// biome-ignore')) {
      errors.push({
        line: index + 1,
        severity: 'error',
        message: 'Avoid using eval() due to security risks',
        rule: 'no-eval',
      });
    }
    
    // Check for innerHTML
    if (line.includes('innerHTML') && !line.includes('// biome-ignore')) {
      errors.push({
        line: index + 1,
        severity: 'error',
        message: 'Avoid using innerHTML. Use textContent or proper React rendering.',
        rule: 'no-inner-html',
      });
    }
    
    // Check for hardcoded secrets
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*["'][^"']{20,}/i,
      /secret\s*[:=]\s*["'][^"']{10,}/i,
      /token\s*[:=]\s*["'][^"']{20,}/i,
      /password\s*[:=]\s*["'][^"']+/i,
    ];
    
    secretPatterns.forEach((pattern) => {
      if (pattern.test(line) && !line.includes('process.env') && !line.includes('import.meta.env')) {
        errors.push({
          line: index + 1,
          severity: 'error',
          message: 'Potential hardcoded secret detected. Use environment variables.',
          rule: 'no-hardcoded-secrets',
        });
      }
    });
  });
  
  return errors;
}

/**
 * Check for missing JSDoc on exported functions
 */
function validateDocumentation(file: FileValidation): Array<ValidationResult['errors'][0]> {
  const errors: Array<ValidationResult['errors'][0]> = [];
  
  // Skip test files
  if (file.path.includes('.test.') || file.path.includes('.spec.')) {
    return errors;
  }
  
  file.lines.forEach((line, index) => {
    // Check for exported functions without JSDoc
    if (line.startsWith('export function') || line.startsWith('export async function')) {
      if (index === 0 || !file.lines[index - 1].includes('*/')) {
        errors.push({
          line: index + 1,
          severity: 'warning',
          message: 'Exported function should have JSDoc documentation',
          rule: 'require-jsdoc',
        });
      }
    }
    
    // Check for exported classes without JSDoc
    if (line.startsWith('export class')) {
      if (index === 0 || !file.lines[index - 1].includes('*/')) {
        errors.push({
          line: index + 1,
          severity: 'warning',
          message: 'Exported class should have JSDoc documentation',
          rule: 'require-jsdoc',
        });
      }
    }
  });
  
  return errors;
}

/**
 * Check for import/export issues
 */
function validateImportsExports(file: FileValidation): Array<ValidationResult['errors'][0]> {
  const errors: Array<ValidationResult['errors'][0]> = [];
  
  // Check for type imports that should use 'import type'
  const typeOnlyImports = ['Result', 'AppError', 'PackageJson'];
  
  file.lines.forEach((line, index) => {
    // Check for missing 'type' keyword in type-only imports
    typeOnlyImports.forEach((typeName) => {
      if (line.includes(`import { ${typeName}`) && !line.includes('import type')) {
        errors.push({
          line: index + 1,
          severity: 'error',
          message: `Use "import type" for type-only import: ${typeName}`,
          rule: 'use-import-type',
        });
      }
    });
    
    // Check for .js extensions in TypeScript files
    if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) {
      if (line.includes("from './") && !line.includes('.js')) {
        errors.push({
          line: index + 1,
          severity: 'warning',
          message: 'TypeScript imports should use .js extension for ESM compatibility',
          rule: 'import-extension',
        });
      }
    }
    
    // Check for barrel exports that could cause circular dependencies
    if (line.includes("export * from") && file.path.includes('index.')) {
      errors.push({
        line: index + 1,
        severity: 'warning',
        message: 'Barrel exports can cause circular dependencies. Consider explicit exports.',
        rule: 'barrel-export-warning',
      });
    }
  });
  
  return errors;
}

/**
 * Run all validations on a single file
 */
function validateFile(filePath: string): Result<ValidationResult, Error> {
  const fileResult = loadFile(filePath);
  if (!fileResult.success) {
    return failure(fileResult.error);
  }
  
  const file = fileResult.data;
  const errors: ValidationResult['errors'] = [];
  
  // Run all validators
  errors.push(...validateResultPattern(file));
  errors.push(...validateTypeAnnotations(file));
  errors.push(...validateSecurity(file));
  errors.push(...validateDocumentation(file));
  errors.push(...validateImportsExports(file));
  
  return success({
    file: filePath,
    errors,
  });
}

/**
 * Format validation results for output
 */
function formatResults(results: Array<ValidationResult>): string {
  const totalErrors = results.reduce((sum, r) => sum + r.errors.filter(e => e.severity === 'error').length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.errors.filter(e => e.severity === 'warning').length, 0);
  
  if (totalErrors === 0 && totalWarnings === 0) {
    return '✅ All validation checks passed!';
  }
  
  let output = '';
  
  results.forEach((result) => {
    if (result.errors.length > 0) {
      output += `\n📁 ${result.file}\n`;
      result.errors.forEach((error) => {
        const icon = error.severity === 'error' ? '❌' : '⚠️';
        const location = error.line ? `:${error.line}` : '';
        output += `  ${icon} ${location} ${error.message}`;
        if (error.rule) {
          output += ` [${error.rule}]`;
        }
        output += '\n';
      });
    }
  });
  
  output += '\n';
  output += `Summary: ${totalErrors} error(s), ${totalWarnings} warning(s)\n`;
  
  return output;
}

/**
 * Main validation runner
 */
async function main(): Promise<void> {
  console.log('🔍 Running pre-commit validation...\n');
  
  // Get staged files
  const filesResult = await getStagedFiles();
  if (!filesResult.success) {
    console.error('Failed to get staged files:', filesResult.error.message);
    process.exit(1);
  }
  
  const files = filesResult.data;
  if (files.length === 0) {
    console.log('No TypeScript/JavaScript files staged for commit.');
    process.exit(0);
  }
  
  console.log(`Validating ${files.length} file(s)...\n`);
  
  // Validate each file
  const results: Array<ValidationResult> = [];
  for (const file of files) {
    const result = validateFile(file);
    if (result.success) {
      results.push(result.data);
    } else {
      console.error(`Failed to validate ${file}:`, result.error.message);
    }
  }
  
  // Format and display results
  const output = formatResults(results);
  console.log(output);
  
  // Exit with error if there are any errors
  const hasErrors = results.some(r => r.errors.some(e => e.severity === 'error'));
  if (hasErrors) {
    console.error('\n❌ Pre-commit validation failed. Please fix the errors above.');
    process.exit(1);
  }
  
  // Show warning but allow commit if only warnings
  const hasWarnings = results.some(r => r.errors.some(e => e.severity === 'warning'));
  if (hasWarnings) {
    console.warn('\n⚠️  Warnings detected. Consider addressing them before committing.');
  }
  
  process.exit(0);
}

// Run the validation
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});