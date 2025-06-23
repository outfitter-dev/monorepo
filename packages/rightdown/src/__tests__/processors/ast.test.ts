import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  Result,
  success,
  failure,
  makeError,
  isSuccess,
  isFailure,
  type AppError,
} from '@outfitter/contracts';

// Import the real implementation
import { AstProcessor } from '../../processors/ast.js';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('AstProcessor', () => {
  const processor = new AstProcessor();
  const fixturesPath = join(__dirname, '../fixtures/markdown');

  describe('extractCodeBlocks', () => {
    it('should extract code blocks from basic markdown', async () => {
      const markdown = readFileSync(join(fixturesPath, 'basic.md'), 'utf-8');
      const result = await processor.extractCodeBlocks(markdown);

      expect(result.success).toBe(true);
      if (result.success) {
        const { codeBlocks } = result.data;
        expect(codeBlocks).toHaveLength(4);

        // Check first code block (JavaScript)
        expect(codeBlocks[0].lang).toBe('javascript');
        expect(codeBlocks[0].value).toContain('const greeting = "Hello, World!"');

        // Check second code block (TypeScript)
        expect(codeBlocks[1].lang).toBe('typescript');
        expect(codeBlocks[1].value).toContain('interface User');

        // Check third code block (JSON)
        expect(codeBlocks[2].lang).toBe('json');

        // Check fourth code block (no language)
        expect(codeBlocks[3].lang).toBe(null);
      }
    });

    it('should handle nested code blocks', async () => {
      const markdown = readFileSync(join(fixturesPath, 'nested-blocks.md'), 'utf-8');
      const result = await processor.extractCodeBlocks(markdown);

      expect(result.success).toBe(true);
      if (result.success) {
        const { codeBlocks } = result.data;
        // Should extract all code blocks, including nested ones
        expect(codeBlocks.length).toBeGreaterThan(0);

        // Check that markdown code blocks are properly identified
        const markdownBlocks = codeBlocks.filter((b) => b.lang === 'markdown');
        expect(markdownBlocks.length).toBeGreaterThan(0);
      }
    });

    it('should extract position information for each code block', async () => {
      const markdown = `# Test

\`\`\`javascript
const x = 1;
\`\`\`

Some text

\`\`\`typescript
const y: number = 2;
\`\`\``;

      const result = await processor.extractCodeBlocks(markdown);

      expect(result.success).toBe(true);
      if (result.success) {
        const { codeBlocks } = result.data;
        expect(codeBlocks).toHaveLength(2);

        // Check position info exists
        expect(codeBlocks[0].position).toBeDefined();
        expect(codeBlocks[0].position.start.line).toBeLessThan(codeBlocks[0].position.end.line);

        // Second block should start after first
        expect(codeBlocks[1].position.start.line).toBeGreaterThan(codeBlocks[0].position.end.line);
      }
    });

    it('should handle tilde fence markers', async () => {
      const markdown = `# Test

~~~javascript
const x = 1;
~~~

~~~
no language
~~~`;

      const result = await processor.extractCodeBlocks(markdown);

      expect(result.success).toBe(true);
      if (result.success) {
        const { codeBlocks } = result.data;
        expect(codeBlocks).toHaveLength(2);
        expect(codeBlocks[0].lang).toBe('javascript');
        expect(codeBlocks[1].lang).toBe(null);
      }
    });

    it('should extract meta information from code blocks', async () => {
      const markdown = `\`\`\`javascript {highlight: [1, 3]}
const x = 1;
const y = 2;
const z = 3;
\`\`\``;

      const result = await processor.extractCodeBlocks(markdown);

      expect(result.success).toBe(true);
      if (result.success) {
        const { codeBlocks } = result.data;
        expect(codeBlocks[0].meta).toBe('{highlight: [1, 3]}');
      }
    });

    it('should handle edge cases from fixtures', async () => {
      const markdown = readFileSync(join(fixturesPath, 'edge-cases.md'), 'utf-8');
      const result = await processor.extractCodeBlocks(markdown);

      expect(result.success).toBe(true);
      if (result.success) {
        const { codeBlocks } = result.data;
        expect(codeBlocks.length).toBeGreaterThan(0);

        // Should handle various edge cases without throwing
        // Specific assertions would depend on implementation
      }
    });
  });

  describe('replaceCodeBlocks', () => {
    it('should replace code blocks with formatted content', async () => {
      const markdown = `# Test

\`\`\`javascript
const x=1;
\`\`\`

Some text

\`\`\`typescript
const y:number=2;
\`\`\``;

      const replacements = new Map<number, string>([
        [0, 'const x = 1;'],
        [1, 'const y: number = 2;'],
      ]);

      const result = await processor.replaceCodeBlocks(markdown, replacements);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('const x = 1;');
        expect(result.data).toContain('const y: number = 2;');
        expect(result.data).toContain('Some text'); // Preserve non-code content
      }
    });

    it('should preserve code block fence style and language', async () => {
      const markdown = `~~~javascript
const x=1;
~~~`;

      const replacements = new Map<number, string>([[0, 'const x = 1;']]);

      const result = await processor.replaceCodeBlocks(markdown, replacements);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('~~~javascript');
        expect(result.data).toContain('~~~');
      }
    });

    it('should handle empty replacements map', async () => {
      const markdown = `# Test

\`\`\`javascript
const x = 1;
\`\`\``;

      const replacements = new Map<number, string>();
      const result = await processor.replaceCodeBlocks(markdown, replacements);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should return original markdown unchanged
        expect(result.data).toBe(markdown);
      }
    });

    it('should handle partial replacements', async () => {
      const markdown = `\`\`\`javascript
const x=1;
\`\`\`

\`\`\`typescript
const y:number=2;
\`\`\``;

      // Only replace the first block
      const replacements = new Map<number, string>([[0, 'const x = 1;']]);

      const result = await processor.replaceCodeBlocks(markdown, replacements);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('const x = 1;');
        expect(result.data).toContain('const y:number=2;'); // Unchanged
      }
    });
  });

  describe('normalizeLanguage', () => {
    it('should normalize common language aliases', () => {
      expect(processor.normalizeLanguage('js')).toBe('javascript');
      expect(processor.normalizeLanguage('ts')).toBe('typescript');
      expect(processor.normalizeLanguage('jsx')).toBe('javascript');
      expect(processor.normalizeLanguage('tsx')).toBe('typescript');
      expect(processor.normalizeLanguage('yml')).toBe('yaml');
      expect(processor.normalizeLanguage('md')).toBe('markdown');
    });

    it('should handle null and undefined', () => {
      expect(processor.normalizeLanguage(null)).toBe(null);
    });

    it('should lowercase unknown languages', () => {
      expect(processor.normalizeLanguage('Python')).toBe('python');
      expect(processor.normalizeLanguage('RUST')).toBe('rust');
    });

    it('should preserve already normalized languages', () => {
      expect(processor.normalizeLanguage('javascript')).toBe('javascript');
      expect(processor.normalizeLanguage('typescript')).toBe('typescript');
      expect(processor.normalizeLanguage('python')).toBe('python');
    });
  });
});
