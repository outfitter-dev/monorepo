#!/usr/bin/env bun
/**
 * Custom linting rules specific to the Outfitter monorepo
 * These rules enforce patterns that are specific to our codebase
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { Result, success, failure, makeError } from '@outfitter/contracts';

interface LintRule {
  name: string;
  description: string;
  severity: 'error' | 'warning';
  test: (file: FileContext) => Array<LintViolation>;
}

interface FileContext {
  path: string;
  content: string;
  lines: Array<string>;
  isTest: boolean;
  isConfig: boolean;
  packageName?: string;
}

interface LintViolation {
  line?: number;
  column?: number;
  message: string;
  fix?: string;
}

/**
 * Rule: Enforce Result pattern usage
 */
const resultPatternRule: LintRule = {
  name: 'result-pattern',
  description: 'Enforce proper Result pattern usage from @outfitter/contracts',
  severity: 'error',
  test: (file) => {
    const violations: Array<LintViolation> = [];
    
    // Skip contracts package itself
    if (file.path.includes('packages/contracts')) {
      return violations;
    }
    
    // Check for functions that should return Result
    file.lines.forEach((line, index) => {
      // Look for try-catch blocks that should use Result
      if (line.includes('try {')) {
        const nextLines = file.lines.slice(index, Math.min(index + 10, file.lines.length));
        const hasCatch = nextLines.some(l => l.includes('catch'));
        const hasThrow = nextLines.some(l => l.includes('throw'));
        
        if (hasCatch && hasThrow && !file.content.includes('Result<')) {
          violations.push({
            line: index + 1,
            message: 'Consider using Result pattern instead of try-catch with throw',
            fix: 'Import { Result, success, failure, makeError } from "@outfitter/contracts"',
          });
        }
      }
      
      // Check for async functions without Result return type
      if ((line.includes('async function') || line.includes('async (')) && 
          !line.includes('Result<') && 
          !file.isTest) {
        const functionName = line.match(/function\s+(\w+)/)?.[1] || 'anonymous';
        violations.push({
          line: index + 1,
          message: `Async function "${functionName}" should return Result<T, AppError> for consistent error handling`,
        });
      }
    });
    
    return violations;
  },
};

/**
 * Rule: Enforce import path consistency
 */
const importPathRule: LintRule = {
  name: 'import-paths',
  description: 'Enforce consistent import paths across the monorepo',
  severity: 'error',
  test: (file) => {
    const violations: Array<LintViolation> = [];
    
    file.lines.forEach((line, index) => {
      // Check for incorrect internal package imports
      if (line.includes('from "../') && line.includes('packages/')) {
        violations.push({
          line: index + 1,
          message: 'Use workspace imports (@outfitter/*) instead of relative paths to other packages',
          fix: 'Change to: import ... from "@outfitter/package-name"',
        });
      }
      
      // Check for missing .js extensions in TypeScript files
      if ((file.path.endsWith('.ts') || file.path.endsWith('.tsx')) && 
          line.includes('from "./') && 
          !line.includes('.js') && 
          !line.includes('.json')) {
        violations.push({
          line: index + 1,
          message: 'TypeScript imports should use .js extension for ESM compatibility',
          fix: 'Add .js extension to the import path',
        });
      }
      
      // Check for incorrect type imports
      const typeOnlyImports = ['Result', 'AppError', 'PackageJson', 'DeepReadonly'];
      typeOnlyImports.forEach((typeName) => {
        if (line.includes(`import { ${typeName}`) && !line.includes('import type')) {
          violations.push({
            line: index + 1,
            message: `Use "import type" for type-only import: ${typeName}`,
            fix: `Change to: import type { ${typeName} } from ...`,
          });
        }
      });
    });
    
    return violations;
  },
};

/**
 * Rule: Enforce logging patterns
 */
const loggingPatternRule: LintRule = {
  name: 'logging-pattern',
  description: 'Enforce proper logging patterns based on package type',
  severity: 'warning',
  test: (file) => {
    const violations: Array<LintViolation> = [];
    
    // Determine if this is a library or CLI tool
    const isCLI = file.path.includes('packages/cli') || 
                  file.path.includes('scripts/') ||
                  file.path.includes('commands/');
    const isLibrary = file.path.includes('packages/') && !isCLI && !file.isTest;
    
    file.lines.forEach((line, index) => {
      // Check for console usage in libraries
      if (isLibrary && line.includes('console.') && !line.includes('// biome-ignore')) {
        violations.push({
          line: index + 1,
          message: 'Libraries should use structured logging (Pino) instead of console',
          fix: 'Use a logger instance: import { logger } from "./logger"',
        });
      }
      
      // Check for missing emojis in CLI output
      if (isCLI && line.includes('console.log(') && !file.isTest) {
        const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(line);
        const isPlainMessage = /console\.log\(['"`][A-Z]/.test(line);
        
        if (isPlainMessage && !hasEmoji) {
          violations.push({
            line: index + 1,
            message: 'CLI output should use emojis for better UX',
            fix: 'Add appropriate emoji: ✅ ❌ 🔍 📦 ⚠️ 🚀',
          });
        }
      }
    });
    
    return violations;
  },
};

/**
 * Rule: Enforce documentation standards
 */
const documentationRule: LintRule = {
  name: 'documentation',
  description: 'Enforce JSDoc documentation for exported items',
  severity: 'warning',
  test: (file) => {
    const violations: Array<LintViolation> = [];
    
    // Skip test and config files
    if (file.isTest || file.isConfig) {
      return violations;
    }
    
    file.lines.forEach((line, index) => {
      // Check for exported functions without JSDoc
      if (line.startsWith('export') && 
          (line.includes('function') || line.includes('const') && line.includes('=>'))) {
        const prevLine = index > 0 ? file.lines[index - 1] : '';
        if (!prevLine.includes('*/')) {
          const functionName = line.match(/(?:function|const)\s+(\w+)/)?.[1] || 'anonymous';
          violations.push({
            line: index + 1,
            message: `Exported function "${functionName}" should have JSDoc documentation`,
            fix: `Add JSDoc:\n/**\n * Description\n * @param paramName - Description\n * @returns Description\n */`,
          });
        }
      }
      
      // Check for complex functions without comments
      if (line.includes('function') || line.includes('=>')) {
        // Look ahead for function complexity
        const functionEnd = file.lines.slice(index).findIndex(l => l.includes('}'));
        if (functionEnd > 20) {
          const hasComments = file.lines.slice(index, index + functionEnd).some(l => l.includes('//') || l.includes('/*'));
          if (!hasComments) {
            violations.push({
              line: index + 1,
              message: 'Complex function should have inline comments explaining logic',
            });
          }
        }
      }
    });
    
    return violations;
  },
};

/**
 * Rule: Enforce test structure
 */
const testStructureRule: LintRule = {
  name: 'test-structure',
  description: 'Enforce consistent test structure and patterns',
  severity: 'warning',
  test: (file) => {
    const violations: Array<LintViolation> = [];
    
    // Only check test files
    if (!file.isTest) {
      return violations;
    }
    
    // Check for proper test structure
    const hasDescribe = file.content.includes('describe(');
    const hasTest = file.content.includes('test(') || file.content.includes('it(');
    const hasExpect = file.content.includes('expect(');
    
    if (!hasDescribe && hasTest) {
      violations.push({
        message: 'Test file should use describe blocks to group related tests',
        fix: 'Wrap related tests in describe() blocks',
      });
    }
    
    // Check for missing assertions
    file.lines.forEach((line, index) => {
      if ((line.includes('test(') || line.includes('it(')) && !line.includes('skip')) {
        // Find the test body
        const testEnd = file.lines.slice(index).findIndex(l => l.includes('})'));
        const testBody = file.lines.slice(index, index + testEnd).join('\n');
        
        if (!testBody.includes('expect(')) {
          violations.push({
            line: index + 1,
            message: 'Test should have at least one assertion',
            fix: 'Add expect() assertions to verify behavior',
          });
        }
      }
    });
    
    return violations;
  },
};

/**
 * Load file context
 */
function loadFileContext(filePath: string): Result<FileContext, Error> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const isTest = filePath.includes('.test.') || filePath.includes('.spec.');
    const isConfig = filePath.includes('.config.') || filePath.endsWith('rc.js');
    
    // Extract package name
    const packageMatch = filePath.match(/packages\/([^/]+)\//);
    const packageName = packageMatch ? packageMatch[1] : undefined;
    
    return success({
      path: filePath,
      content,
      lines,
      isTest,
      isConfig,
      packageName,
    });
  } catch (error) {
    return failure(makeError('FILE_READ_ERROR', `Failed to read file: ${error}`));
  }
}

/**
 * Get all TypeScript/JavaScript files recursively
 */
function getFiles(dir: string, files: Array<string> = []): Array<string> {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    
    // Skip node_modules, dist, coverage, etc.
    if (entry.startsWith('.') || 
        entry === 'node_modules' || 
        entry === 'dist' || 
        entry === 'coverage' || 
        entry === 'build') {
      continue;
    }
    
    if (statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else {
      const ext = extname(fullPath);
      if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Run all rules on a file
 */
function lintFile(filePath: string, rules: Array<LintRule>): Result<Array<{ rule: string; violations: Array<LintViolation> }>, Error> {
  const contextResult = loadFileContext(filePath);
  if (!contextResult.success) {
    return failure(contextResult.error);
  }
  
  const context = contextResult.data;
  const results: Array<{ rule: string; violations: Array<LintViolation> }> = [];
  
  for (const rule of rules) {
    const violations = rule.test(context);
    if (violations.length > 0) {
      results.push({
        rule: rule.name,
        violations,
      });
    }
  }
  
  return success(results);
}

/**
 * Format lint results
 */
function formatResults(
  results: Map<string, Array<{ rule: string; violations: Array<LintViolation> }>>,
  baseDir: string
): string {
  let output = '';
  let totalViolations = 0;
  
  results.forEach((fileResults, filePath) => {
    if (fileResults.length > 0) {
      const relativePath = relative(baseDir, filePath);
      output += `\n📁 ${relativePath}\n`;
      
      fileResults.forEach(({ rule, violations }) => {
        violations.forEach((violation) => {
          totalViolations++;
          const location = violation.line ? `:${violation.line}` : '';
          output += `  ${location} ${violation.message} [${rule}]\n`;
          if (violation.fix) {
            output += `    💡 ${violation.fix}\n`;
          }
        });
      });
    }
  });
  
  if (totalViolations === 0) {
    output = '✅ No custom lint violations found!\n';
  } else {
    output = `\n🔍 Custom Lint Results\n` + output;
    output += `\nTotal violations: ${totalViolations}\n`;
  }
  
  return output;
}

/**
 * Main CLI
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  console.log('🔍 Running custom lint rules...\n');
  
  // Define rules
  const rules: Array<LintRule> = [
    resultPatternRule,
    importPathRule,
    loggingPatternRule,
    documentationRule,
    testStructureRule,
  ];
  
  // Get files to lint - handle both directory and file arguments
  let files: Array<string>;
  
  if (args.length > 0) {
    // If arguments passed (likely from lefthook with staged files)
    files = args.filter(file => 
      file.match(/\.(ts|tsx|js|jsx)$/) && 
      existsSync(file) && 
      statSync(file).isFile()
    );
  } else {
    // Default: scan current directory
    files = getFiles('.');
  }
  
  console.log(`Checking ${files.length} files...\n`);
  
  // Run linting
  const results = new Map<string, Array<{ rule: string; violations: Array<LintViolation> }>>();
  
  for (const file of files) {
    const lintResult = lintFile(file, rules);
    if (lintResult.success && lintResult.data.length > 0) {
      results.set(file, lintResult.data);
    }
  }
  
  // Format and display results
  const output = formatResults(results, targetPath);
  console.log(output);
  
  // Exit with error if violations found
  if (results.size > 0) {
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

// Export for use as a module
export { 
  lintFile, 
  getFiles, 
  resultPatternRule,
  importPathRule,
  loggingPatternRule,
  documentationRule,
  testStructureRule,
};