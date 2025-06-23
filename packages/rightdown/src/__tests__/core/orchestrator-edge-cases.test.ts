import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Orchestrator } from '../../core/orchestrator.js';
import type { RightdownConfig } from '../../core/types.js';
import type { IFormatter } from '../../formatters/base.js';
import { success, failure, makeError } from '@outfitter/contracts';
import { RIGHTDOWN_ERROR_CODES } from '../../core/errors.js';

describe('Orchestrator - Edge Cases', () => {
  let mockFormatter: IFormatter;
  let formatters: Map<string, IFormatter>;
  let config: RightdownConfig;

  beforeEach(() => {
    mockFormatter = {
      format: vi.fn().mockResolvedValue(
        success({
          formatted: 'const x = 1;',
          didChange: true,
        })
      ),
      isAvailable: vi.fn().mockReturnValue(true),
      getLanguages: vi.fn().mockReturnValue(['javascript', 'typescript']),
    };

    formatters = new Map([['prettier', mockFormatter]]);
    
    config = {
      version: 2,
      preset: 'standard',
      formatters: {
        default: 'prettier',
      },
    };
  });

  describe('Complex code block scenarios', () => {
    it('should handle code blocks with language aliases', async () => {
      const markdown = `
# Test

\`\`\`js
const x=1
\`\`\`

\`\`\`ts
const y:number=2
\`\`\`
`;

      // Create formatter that handles aliases
      const aliasFormatter: IFormatter = {
        format: vi.fn().mockImplementation((code, lang) => {
          if (lang === 'js' || lang === 'javascript') {
            return success({ formatted: 'const x = 1;', didChange: true });
          }
          if (lang === 'ts' || lang === 'typescript') {
            return success({ formatted: 'const y: number = 2;', didChange: true });
          }
          return failure(makeError(RIGHTDOWN_ERROR_CODES.FORMATTER_FAILED, 'Unsupported'));
        }),
        isAvailable: vi.fn().mockReturnValue(true),
        getLanguages: vi.fn().mockReturnValue(['javascript', 'typescript', 'js', 'ts']),
      };

      const orchestrator = new Orchestrator({
        config,
        formatters: new Map([['prettier', aliasFormatter]]),
      });

      const result = await orchestrator.format(markdown);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toContain('const x = 1;');
        expect(result.data.content).toContain('const y: number = 2;');
      }
    });

    it('should handle code blocks with metadata', async () => {
      const markdown = `
# Test

\`\`\`javascript {highlight: [1,3]}
const x=1
const y=2
const z=3
\`\`\`
`;

      const orchestrator = new Orchestrator({ config, formatters });
      const result = await orchestrator.format(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Metadata should be preserved
        expect(result.data.content).toContain('```javascript {highlight: [1,3]}');
      }
    });

    it('should handle code blocks with empty language', async () => {
      const markdown = `
# Test

\`\`\`
plain text content
\`\`\`
`;

      const orchestrator = new Orchestrator({ config, formatters });
      const result = await orchestrator.format(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // With no language, it gets formatted as 'text' which our mock formats
        expect(result.data.content).toContain('const x = 1;'); // Mock formatter output
        expect(result.data.stats.blocksProcessed).toBe(1);
        expect(result.data.stats.blocksFormatted).toBe(1);
      }
    });

    it('should handle very long code blocks', async () => {
      const longCode = Array(1000).fill('const x = 1;').join('\n');
      const markdown = `
# Test

\`\`\`javascript
${longCode}
\`\`\`
`;

      const orchestrator = new Orchestrator({ config, formatters });
      const result = await orchestrator.format(markdown);
      
      expect(result.success).toBe(true);
      expect(mockFormatter.format).toHaveBeenCalledWith(longCode, 'javascript', undefined);
    });

    it('should handle code blocks with CRLF line endings', async () => {
      const markdown = '# Test\r\n\r\n```javascript\r\nconst x=1\r\n```\r\n';
      
      const orchestrator = new Orchestrator({ config, formatters });
      const result = await orchestrator.format(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Should preserve CRLF endings
        expect(result.data.content).toContain('\r\n');
      }
    });
  });

  describe('Error recovery', () => {
    it('should continue processing after formatter error', async () => {
      const markdown = `
# Test

\`\`\`javascript
invalid {{{{ syntax
\`\`\`

\`\`\`javascript
const valid = true;
\`\`\`
`;

      let callCount = 0;
      const errorFormatter: IFormatter = {
        format: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return failure(makeError(RIGHTDOWN_ERROR_CODES.FORMATTER_FAILED, 'Syntax error'));
          }
          return success({ formatted: 'const valid = true;', didChange: true });
        }),
        isAvailable: vi.fn().mockReturnValue(true),
        getLanguages: vi.fn().mockReturnValue(['javascript']),
      };

      const orchestrator = new Orchestrator({
        config,
        formatters: new Map([['prettier', errorFormatter]]),
      });

      const result = await orchestrator.format(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toContain('invalid {{{{ syntax'); // Unchanged
        expect(result.data.content).toContain('const valid = true;'); // Formatted
        expect(result.data.stats.blocksProcessed).toBe(2);
        expect(result.data.stats.blocksFormatted).toBe(1);
      }
    });

    it('should handle formatter timeout gracefully', async () => {
      const timeoutFormatter: IFormatter = {
        format: vi.fn().mockResolvedValue(
          failure(makeError(RIGHTDOWN_ERROR_CODES.FORMATTER_TIMEOUT, 'Formatter timeout'))
        ),
        isAvailable: vi.fn().mockReturnValue(true),
        getLanguages: vi.fn().mockReturnValue(['javascript']),
      };

      const orchestrator = new Orchestrator({
        config,
        formatters: new Map([['prettier', timeoutFormatter]]),
      });

      const markdown = '```javascript\nconst x = 1;\n```';
      const result = await orchestrator.format(markdown);
      
      // Should handle the error and return the original content
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe(markdown);
        expect(result.data.stats.blocksFormatted).toBe(0);
      }
    });
  });

  describe('Formatter selection', () => {
    it('should use language-specific formatter over default', async () => {
      const prettierFormatter: IFormatter = {
        format: vi.fn().mockResolvedValue(
          success({ formatted: 'prettier formatted', didChange: true })
        ),
        isAvailable: vi.fn().mockReturnValue(true),
        getLanguages: vi.fn().mockReturnValue(['javascript', 'html']),
      };

      const biomeFormatter: IFormatter = {
        format: vi.fn().mockResolvedValue(
          success({ formatted: 'biome formatted', didChange: true })
        ),
        isAvailable: vi.fn().mockReturnValue(true),
        getLanguages: vi.fn().mockReturnValue(['javascript', 'typescript']),
      };

      const configWithRouting: RightdownConfig = {
        ...config,
        formatters: {
          default: 'prettier',
          languages: {
            javascript: 'biome',
          },
        },
      };

      const orchestrator = new Orchestrator({
        config: configWithRouting,
        formatters: new Map([
          ['prettier', prettierFormatter],
          ['biome', biomeFormatter],
        ]),
      });

      const markdown = `
\`\`\`javascript
code
\`\`\`

\`\`\`html
<div>
\`\`\`
`;

      const result = await orchestrator.format(markdown);
      
      expect(biomeFormatter.format).toHaveBeenCalledWith('code', 'javascript', undefined);
      expect(prettierFormatter.format).toHaveBeenCalledWith('<div>', 'html', undefined);
    });

    it('should fall back to default formatter when specific formatter unavailable', async () => {
      const configWithMissing: RightdownConfig = {
        ...config,
        formatters: {
          default: 'prettier',
          languages: {
            javascript: 'nonexistent',
          },
        },
      };

      const orchestrator = new Orchestrator({
        config: configWithMissing,
        formatters,
      });

      const markdown = '```javascript\ncode\n```';
      const result = await orchestrator.format(markdown);
      
      expect(result.success).toBe(true);
      expect(mockFormatter.format).toHaveBeenCalled();
    });
  });

  describe('Special markdown structures', () => {
    it('should not format indented code blocks', async () => {
      const markdown = `
# Test

    // This is an indented code block
    const x = 1;
    const y = 2;

Regular paragraph.
`;

      const orchestrator = new Orchestrator({ config, formatters });
      const result = await orchestrator.format(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe(markdown);
        expect(result.data.stats.blocksProcessed).toBe(0);
      }
    });

    it('should handle code blocks inside blockquotes', async () => {
      const markdown = `
# Test

> Here's a quote:
> 
> \`\`\`javascript
> const x=1
> \`\`\`
`;

      const orchestrator = new Orchestrator({ config, formatters });
      const result = await orchestrator.format(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Code blocks in blockquotes are skipped by our AST processor
        expect(result.data.content).toBe(markdown);
        expect(result.data.stats.blocksProcessed).toBe(0);
      }
    });

    it('should handle code blocks in lists', async () => {
      const markdown = `
# Test

1. First item
   \`\`\`javascript
   const x=1
   \`\`\`

2. Second item
`;

      const orchestrator = new Orchestrator({ config, formatters });
      const result = await orchestrator.format(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Code blocks in lists are formatted normally
        expect(result.data.content).toContain('const x = 1;');
        expect(result.data.stats.blocksProcessed).toBe(1);
        expect(result.data.stats.blocksFormatted).toBe(1);
      }
    });
  });

  describe('Performance and stats', () => {
    it('should track accurate statistics', async () => {
      const markdown = `
\`\`\`javascript
const a=1
\`\`\`

\`\`\`css
.class{color:red}
\`\`\`

\`\`\`
plain text
\`\`\`

\`\`\`unknown
some code
\`\`\`
`;

      const cssFormatter: IFormatter = {
        format: vi.fn().mockResolvedValue(
          success({ formatted: '.class { color: red; }', didChange: true })
        ),
        isAvailable: vi.fn().mockReturnValue(true),
        getLanguages: vi.fn().mockReturnValue(['css']),
      };

      const orchestrator = new Orchestrator({
        config,
        formatters: new Map([
          ['prettier', mockFormatter],
          ['css-formatter', cssFormatter],
        ]),
      });

      const result = await orchestrator.format(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const { stats } = result.data;
        expect(stats.blocksProcessed).toBe(4);
        expect(stats.blocksFormatted).toBe(4); // All blocks are formatted by mock formatter
        expect(stats.formattingDuration).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle empty markdown', async () => {
      const orchestrator = new Orchestrator({ config, formatters });
      const result = await orchestrator.format('');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('');
        expect(result.data.stats.blocksProcessed).toBe(0);
      }
    });

    it('should handle markdown with no code blocks', async () => {
      const markdown = `
# Just a heading

Some paragraph text.

- List item 1
- List item 2
`;

      const orchestrator = new Orchestrator({ config, formatters });
      const result = await orchestrator.format(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe(markdown);
        expect(result.data.stats.blocksProcessed).toBe(0);
        expect(result.data.stats.blocksFormatted).toBe(0);
      }
    });
  });
});