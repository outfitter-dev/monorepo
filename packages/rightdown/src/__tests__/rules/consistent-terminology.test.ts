import { describe, it, expect } from 'vitest';
import rule from '../../rules/consistent-terminology.js';

describe('consistent-terminology rule', () => {
  it('should export required properties', () => {
    expect(rule).toHaveProperty('names');
    expect(rule.names).toContain('MD100');
    expect(rule.names).toContain('consistent-terminology');
    expect(rule).toHaveProperty('description', 'Terminology should be consistent');
    expect(rule).toHaveProperty('tags', ['terminology']);
    expect(rule).toHaveProperty('function');
  });

  describe('rule function', () => {
    // Mock params object
    const createParams = (lines: string[], terminology: any[] = []) => ({
      lines,
      config: {
        terminology,
      },
    });

    // Mock onError callback
    const createOnError = () => {
      const errors: any[] = [];
      const onError = (error: any) => {
        errors.push(error);
      };
      return { onError, errors };
    };

    it('should detect incorrect terminology', () => {
      const params = createParams(
        ['Using javascript and typescript', 'Install with NPM', 'Host on Github'],
        [
          { incorrect: 'javascript', correct: 'JavaScript' },
          { incorrect: 'typescript', correct: 'TypeScript' },
          { incorrect: 'NPM', correct: 'npm' },
          { incorrect: 'Github', correct: 'GitHub' },
        ],
      );
      const { onError, errors } = createOnError();

      rule.function(params, onError);

      expect(errors).toHaveLength(4);
      expect(errors[0]).toMatchObject({
        lineNumber: 1,
        detail: 'Use "JavaScript" instead of "javascript"',
        fixInfo: {
          editColumn: 7,
          deleteCount: 10,
          insertText: 'JavaScript',
        },
      });
    });

    it('should not flag correct terminology', () => {
      const params = createParams(
        ['Using JavaScript and TypeScript', 'Install with npm', 'Host on GitHub'],
        [
          { incorrect: 'javascript', correct: 'JavaScript' },
          { incorrect: 'typescript', correct: 'TypeScript' },
          { incorrect: 'NPM', correct: 'npm' },
          { incorrect: 'Github', correct: 'GitHub' },
        ],
      );
      const { onError, errors } = createOnError();

      rule.function(params, onError);

      expect(errors).toHaveLength(0);
    });

    it('should preserve case when all caps', () => {
      const params = createParams(
        ['JAVASCRIPT is great', 'Use NPM or GITHUB'],
        [
          { incorrect: 'javascript', correct: 'JavaScript' },
          { incorrect: 'NPM', correct: 'npm' },
          { incorrect: 'github', correct: 'GitHub' },
        ],
      );
      const { onError, errors } = createOnError();

      rule.function(params, onError);

      expect(errors).toHaveLength(3);
      expect(errors[0].fixInfo.insertText).toBe('JAVASCRIPT');
      expect(errors[1].fixInfo.insertText).toBe('NPM');
      expect(errors[2].fixInfo.insertText).toBe('GITHUB');
    });

    it('should handle word boundaries correctly', () => {
      const params = createParams(
        [
          'javascriptFunction', // Should not match
          'my-javascript-app', // Should match
          'JavaScript', // Should not match (already correct)
        ],
        [{ incorrect: 'javascript', correct: 'JavaScript' }],
      );
      const { onError, errors } = createOnError();

      rule.function(params, onError);

      expect(errors).toHaveLength(1);
      expect(errors[0].lineNumber).toBe(2);
    });

    it('should handle empty config gracefully', () => {
      const params = createParams(['Some text'], []);
      const { onError, errors } = createOnError();

      expect(() => rule.function(params, onError)).not.toThrow();
      expect(errors).toHaveLength(0);
    });

    it('should handle multi-word terms', () => {
      const params = createParams(
        ['The node.js runtime', 'Using visual studio code'],
        [
          { incorrect: 'node.js', correct: 'Node.js' },
          { incorrect: 'visual studio code', correct: 'Visual Studio Code' },
        ],
      );
      const { onError, errors } = createOnError();

      rule.function(params, onError);

      expect(errors).toHaveLength(2);
      expect(errors[0].fixInfo.insertText).toBe('Node.js');
      expect(errors[1].fixInfo.insertText).toBe('Visual Studio Code');
    });
  });
});
