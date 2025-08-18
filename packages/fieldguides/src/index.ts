/**

- @outfitter/fieldguides
-
- Living documentation system that equips AI agents with consistent development practices
 */

// Export metadata about the package
export const metadata = {
  name: '@outfitter/fieldguides',
  version: '0.1.0',
  description:
    'Living documentation system that equips AI agents with consistent development practices',
};

// Export path helpers for accessing content
export const paths = {
  content: './content',
  conventions: './content/conventions',
  guides: './content/guides',
  patterns: './content/patterns',
  standards: './content/standards',
  templates: './content/templates',
  references: './content/references',
  operations: './content/operations',
};

// Export available documentation categories
export const categories = [
  'CODING',
  'TESTING',
  'SECURITY',
  'conventions',
  'guides',
  'patterns',
  'standards',
  'templates',
  'references',
  'operations',
] as const;

export type Category = [typeof categories](number);
