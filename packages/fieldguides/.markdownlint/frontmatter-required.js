// Custom markdownlint rule to ensure frontmatter is present in fieldguide files

import matter from 'gray-matter';

const STANDARDS_FILES = ['CODING.md', 'SECURITY.md', 'TESTING.md'];
const SKIP_FILES = [
  'README.md',
  'FRONTMATTER-SCHEMA.md',
  'MIGRATION_REPORT.md',
];

export default {
  names: ['frontmatter-required'],
  description: 'Fieldguide files must have valid frontmatter',
  tags: ['frontmatter'],
  function: function rule(params, onError) {
    const fileName = params.name.split('/').pop();

    // Skip standards files and other special files
    if (STANDARDS_FILES.includes(fileName) || SKIP_FILES.includes(fileName)) {
      return;
    }

    // Only check files in fieldguides directory
    if (!params.name.includes('/fieldguides/')) {
      return;
    }

    // Skip files in fieldguides-archived
    if (params.name.includes('/fieldguides-archived/')) {
      return;
    }

    const lines = params.lines;
    const content = lines.join('\n');

    try {
      const parsed = matter(content);

      // Check if frontmatter exists
      if (!parsed.data || Object.keys(parsed.data).length === 0) {
        onError({
          lineNumber: 1,
          detail:
            'File must have frontmatter with required fields: slug, title, description, type',
        });
        return;
      }

      // Validate required fields
      const required = ['slug', 'title', 'description', 'type'];
      const missing = required.filter(field => !parsed.data[field]);

      if (missing.length > 0) {
        onError({
          lineNumber: 1,
          detail: `Missing required frontmatter fields: ${missing.join(', ')}`,
        });
      }
    } catch (error) {
      onError({
        lineNumber: 1,
        detail: `Invalid frontmatter: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
};
