/**
 * Check for barrel imports from @outfitter/contracts
 * Encourages use of sub-path imports for better tree-shaking
 */

import { readFileSync } from 'node:fs';
import { globSync } from 'glob';

const IMPORT_PATTERN = /import\s+(?:{[^}]+}|[^}]+)\s+from\s+['"]@outfitter\/contracts['"];?/g;
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/*.test.ts',
  '**/*.spec.ts',
  '**/scripts/**',
];

interface ImportIssue {
  file: string;
  line: number;
  import: string;
}

/**
 * Scans source files for barrel imports from `@outfitter/contracts` and reports any occurrences.
 *
 * If barrel imports are found, logs detailed error messages with file locations and suggests using sub-path imports instead. Exits the process with a non-zero status code if issues are detected.
 */
function checkImports(): void {
  const files = globSync('**/*.{ts,tsx,js,jsx,mjs,cjs}', {
    ignore: IGNORE_PATTERNS,
    cwd: process.cwd(),
  });

  let foundIssues = false;
  const issues: Array<ImportIssue> = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const matches = content.match(IMPORT_PATTERN);

    if (matches) {
      const lines = content.split('\n');
      matches.forEach((match) => {
        const lineNum = lines.findIndex((line) => line.includes(match)) + 1;
        issues.push({
          file,
          line: lineNum,
          import: match.trim(),
        });
      });
      foundIssues = true;
    }
  }

  if (foundIssues) {
    console.error('\n❌ Found barrel imports from @outfitter/contracts:\n');
    issues.forEach(({ file, line, import: imp }) => {
      console.error(`  ${file}:${line}`);
      console.error(`    ${imp}`);
    });
    console.error('\n💡 Use sub-path imports instead:');
    console.error('  - @outfitter/contracts/error');
    console.error('  - @outfitter/contracts/result');
    console.error('  - @outfitter/contracts/assert');
    console.error('  - @outfitter/contracts/branded');
    console.error('  - @outfitter/contracts/types\n');
    process.exit(1);
  } else {
    console.log('✅ No barrel imports from @outfitter/contracts found');
  }
}

try {
  checkImports();
} catch (error) {
  console.error('Error checking imports:', error);
  process.exit(1);
}
