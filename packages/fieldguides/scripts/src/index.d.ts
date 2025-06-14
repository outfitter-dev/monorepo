/**
 * @outfitter/fieldguides
 *
 * Living documentation system that equips AI agents with consistent development practices
 */
export declare const metadata: {
  name: string;
  version: string;
  description: string;
};
export declare const paths: {
  content: string;
  conventions: string;
  guides: string;
  patterns: string;
  standards: string;
  templates: string;
  references: string;
  operations: string;
};
export declare const categories: readonly [
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
];
export type Category = (typeof categories)[number];
