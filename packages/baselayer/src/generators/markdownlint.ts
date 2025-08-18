import { failure, isFailure, type Result, success } from '@outfitter/contracts';
import * as yaml from 'yaml';
import { writeFile } from '../utils/file-system.js';

/**

- Generates markdownlint-cli2 configuration
- Provides sensible defaults for Markdown linting
 */
export async function generateMarkdownlintConfig(): Promise<
  Result<void, Error>
> {
  try {
    const config = {
      config: {
        default: true,
        MD013: {
          line_length: 120,
          code_blocks: false,
          tables: false,
        },
        MD033: false, // Allow inline HTML
        MD041: false, // First line doesn't need to be a heading
        'no-trailing-spaces': false,
        MD024: { siblings_only: true }, // Allow duplicate headings in different sections
        MD026: false, // Allow trailing punctuation in headings
        MD028: false, // Allow blank lines inside blockquotes
        MD036: false, // Allow emphasis used instead of headings
      },
      globs: ['**/*.md', '**/*.mdx'],
      ignores: [
        '**/node_modules',
        '**/dist',
        '**/build',
        '**/coverage',
        '**/.next',
        '**/out',
        '**/vendor',
        '**/*.min.md',
      ],
    };

    // Write .markdownlint-cli2.yaml
    const yamlContent = yaml.stringify(config);
    const writeResult = await writeFile('.markdownlint-cli2.yaml', yamlContent);
    if (isFailure(writeResult)) {
      return failure(new Error(writeResult.error.message));
    }
    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}
