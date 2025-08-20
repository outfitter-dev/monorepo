#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import matter from 'gray-matter';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
} as const;

// Valid document types
const VALID_TYPES = [
  'convention',
  'pattern',
  'guide',
  'template',
  'reference',
] as const;
type ValidType = (typeof VALID_TYPES)[number];

// Files that should NOT have frontmatter
const STANDARDS_FILES = ['CODING.md', 'SECURITY.md', 'TESTING.md'] as const;

// Valid statuses
const VALID_STATUSES = ['draft', 'stable', 'deprecated'] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

// Frontmatter schema
interface FrontmatterData {
  slug?: unknown;
  title?: unknown;
  description?: unknown;
  type?: unknown;
  category?: unknown;
  tags?: unknown;
  related?: unknown;
  status?: unknown;
}

// Validation result
interface ValidationResult {
  field: string;
  error: string;
}

// Validation rule
interface ValidationRule {
  required: boolean;
  validate: (value: unknown) => string | null;
}

// Validation rules
const validationRules: Record<string, ValidationRule> = {
  slug: {
    required: true,
    validate: (value: unknown): string | null => {
      if (typeof value !== 'string') return 'Must be a string';
      if (!/^[a-z0-9-]+$/.test(value))
        return 'Must be kebab-case (lowercase letters, numbers, and hyphens only)';
      return null;
    },
  },
  title: {
    required: true,
    validate: (value: unknown): string | null => {
      if (typeof value !== 'string') return 'Must be a string';
      if (value.length > 60)
        return `Too long (${value.length} chars) - max 60 characters`;
      if (!/^[A-Z]/.test(value)) return 'Should start with a capital letter';
      return null;
    },
  },
  description: {
    required: true,
    validate: (value: unknown): string | null => {
      if (typeof value !== 'string') return 'Must be a string';
      if (value.length > 72)
        return `Too long (${value.length} chars) - max 72 characters`;
      if (!value.endsWith('.')) return 'Should end with a period';
      return null;
    },
  },
  type: {
    required: true,
    validate: (value: unknown): string | null => {
      if (typeof value !== 'string') return 'Must be a string';
      if (!VALID_TYPES.includes(value as ValidType)) {
        return `Invalid type "${value}" - must be one of: ${VALID_TYPES.join(', ')}`;
      }
      return null;
    },
  },
  category: {
    required: false,
    validate: (value: unknown): string | null => {
      if (value !== undefined && value !== null && typeof value !== 'string') {
        return 'Must be a string';
      }
      return null;
    },
  },
  tags: {
    required: false,
    validate: (value: unknown): string | null => {
      if (value !== undefined && value !== null) {
        if (!Array.isArray(value)) return 'Must be an array';
        if (value.some((tag) => typeof tag !== 'string'))
          return 'All tags must be strings';
      }
      return null;
    },
  },
  related: {
    required: false,
    validate: (value: unknown): string | null => {
      if (value !== undefined && value !== null) {
        if (!Array.isArray(value)) return 'Must be an array';
        if (value.some((item) => typeof item !== 'string'))
          return 'All related items must be strings';
      }
      return null;
    },
  },
  status: {
    required: false,
    validate: (value: unknown): string | null => {
      if (value !== undefined && value !== null) {
        if (typeof value !== 'string') return 'Must be a string';
        if (!VALID_STATUSES.includes(value as ValidStatus)) {
          return `Invalid status "${value}" - must be one of: ${VALID_STATUSES.join(', ')}`;
        }
      }
      return null;
    },
  },
};

interface FileValidationResult {
  file: string;
  errors: Array<ValidationResult>;
  isStandardsFile: boolean;
  skipped?: boolean;
}

function validateFile(filePath: string): FileValidationResult {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(process.cwd(), filePath);

  // Check if this is a standards file (should NOT have frontmatter)
  if (STANDARDS_FILES.some((f) => f === fileName)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.startsWith('---')) {
        return {
          file: relativePath,
          errors: [
            {
              field: 'frontmatter',
              error:
                'Standards files (CODING.md, SECURITY.md, TESTING.md) should not have frontmatter',
            },
          ],
          isStandardsFile: true,
        };
      }
      return {
        file: relativePath,
        errors: [],
        isStandardsFile: true,
        skipped: true,
      };
    } catch (error) {
      return {
        file: relativePath,
        errors: [
          {
            field: 'file',
            error: `Error reading file: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isStandardsFile: true,
      };
    }
  }

  // Skip README files
  if (fileName === 'README.md' || fileName.endsWith('.example.md')) {
    return {
      file: relativePath,
      errors: [],
      isStandardsFile: false,
      skipped: true,
    };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check if file has frontmatter
    if (!content.startsWith('---')) {
      return {
        file: relativePath,
        errors: [
          {
            field: 'frontmatter',
            error:
              'No frontmatter found - all non-standards files must have frontmatter',
          },
        ],
        isStandardsFile: false,
      };
    }

    const parsed = matter(content);
    const errors: Array<ValidationResult> = [];

    // Validate required fields
    for (const [field, rule] of Object.entries(validationRules)) {
      const value = (parsed.data as FrontmatterData)[
        field as keyof FrontmatterData
      ];

      if (rule.required && (value === undefined || value === null)) {
        errors.push({
          field,
          error: 'Field is required',
        });
        continue;
      }

      if (value !== undefined && value !== null) {
        const error = rule.validate(value);
        if (error) {
          errors.push({ field, error });
        }
      }
    }

    // Check slug matches filename
    const expectedSlug = path.basename(fileName, '.md');
    const dataSlug = (parsed.data as FrontmatterData).slug;
    if (dataSlug && dataSlug !== expectedSlug) {
      errors.push({
        field: 'slug',
        error: `slug "${dataSlug}" doesn't match filename "${expectedSlug}"`,
      });
    }

    return {
      file: relativePath,
      errors,
      isStandardsFile: false,
    };
  } catch (error) {
    return {
      file: relativePath,
      errors: [
        {
          field: 'file',
          error: `Error parsing file: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isStandardsFile: false,
    };
  }
}

async function main(): Promise<void> {
  console.log(
    `${colors.blue}Validating frontmatter in fieldguides...${colors.reset}\n`
  );

  // Find all markdown files in fieldguides
  const files = await glob('fieldguides/**/*.md', {
    ignore: ['**/node_modules/**', '**/.git/**'],
  });

  const results = files.map((file) => validateFile(file));

  // Separate results
  const validFiles = results.filter((r) => r.errors.length === 0 && !r.skipped);
  const invalidFiles = results.filter((r) => r.errors.length > 0);
  const skippedFiles = results.filter((r) => r.skipped);

  // Display results
  if (validFiles.length > 0) {
    console.log(
      `${colors.green}✓ Valid files (${validFiles.length}):${colors.reset}`
    );
    validFiles.forEach((result) => {
      console.log(`  ${colors.dim}${result.file}${colors.reset}`);
    });
    console.log();
  }

  if (invalidFiles.length > 0) {
    console.log(
      `${colors.red}✗ Invalid files (${invalidFiles.length}):${colors.reset}`
    );
    invalidFiles.forEach((result) => {
      console.log(`  ${colors.red}${result.file}${colors.reset}`);
      result.errors.forEach((error) => {
        console.log(
          `    ${colors.yellow}• ${error.field}: ${error.error}${colors.reset}`
        );
      });
      console.log();
    });
  }

  // Summary
  console.log(`${colors.blue}Summary:${colors.reset}`);
  console.log(`  Total files: ${files.length}`);
  console.log(`  Valid: ${colors.green}${validFiles.length}${colors.reset}`);
  console.log(`  Invalid: ${colors.red}${invalidFiles.length}${colors.reset}`);
  console.log(`  Skipped: ${colors.dim}${skippedFiles.length}${colors.reset}`);

  // Exit with error if any files are invalid
  if (invalidFiles.length > 0) {
    process.exit(1);
  }
}

// Run validation
main().catch((error) => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});
