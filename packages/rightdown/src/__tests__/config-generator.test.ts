import { describe, it, expect } from 'vitest';
import { generateConfig, defaultTerminology } from '../config-generator.js';
import * as yaml from 'js-yaml';

describe('config-generator', () => {
  describe('generateConfig', () => {
    it('should generate config with strict preset', () => {
      const config = generateConfig({ preset: 'strict' });
      const parsed = yaml.load(config) as any;

      expect(parsed.MD013).toBe(false); // MD013 is disabled in strict preset
      expect(parsed.default).toBe(true);
      expect(parsed.ignores).toContain('node_modules/**');
    });

    it('should generate config with standard preset', () => {
      const config = generateConfig({ preset: 'standard' });
      const parsed = yaml.load(config) as any;

      expect(parsed.MD013).toBe(false);
      expect(parsed.MD033).toBe(false);
      expect(parsed.default).toBe(true);
    });

    it('should generate config with relaxed preset', () => {
      const config = generateConfig({ preset: 'relaxed' });
      const parsed = yaml.load(config) as any;

      expect(parsed.default).toBe(false);
      expect(parsed.MD001).toBe(true);
    });

    it('should include custom terminology', () => {
      const customTerminology = [
        { incorrect: 'test', correct: 'Test' },
        { incorrect: 'example', correct: 'Example' },
      ];

      const config = generateConfig({
        preset: 'standard',
        terminology: customTerminology,
      });
      const parsed = yaml.load(config) as any;

      expect(parsed.terminology).toBeDefined();
      expect(parsed.terminology).toEqual(customTerminology);
    });

    it('should merge default and custom terminology', () => {
      const customTerminology = [{ incorrect: 'myterm', correct: 'MyTerm' }];

      const config = generateConfig({
        preset: 'standard',
        terminology: [...defaultTerminology, ...customTerminology],
      });
      const parsed = yaml.load(config) as any;

      expect(parsed.terminology).toHaveLength(defaultTerminology.length + 1);
      expect(parsed.terminology).toContainEqual({ incorrect: 'myterm', correct: 'MyTerm' });
    });

    it('should include custom rule paths', () => {
      const customRules = ['/path/to/rule1.js', '/path/to/rule2.js'];

      const config = generateConfig({
        preset: 'standard',
        customRules,
      });
      const parsed = yaml.load(config) as any;

      expect(parsed.customRules[0]).toBe('/path/to/rule1.js');
      expect(parsed.customRules[1]).toBe('/path/to/rule2.js');
    });

    it('should exclude patterns', () => {
      const config = generateConfig({ preset: 'standard' });
      const parsed = yaml.load(config) as any;

      expect(parsed.ignores).toContain('node_modules/**');
      expect(parsed.ignores).toContain('.git/**');
      expect(parsed.ignores).toContain('dist/**');
    });
  });

  describe('defaultTerminology', () => {
    it('should include common technical terms', () => {
      expect(defaultTerminology).toContainEqual({ incorrect: 'Javascript', correct: 'JavaScript' });
      expect(defaultTerminology).toContainEqual({ incorrect: 'Typescript', correct: 'TypeScript' });
      expect(defaultTerminology).toContainEqual({ incorrect: 'NPM', correct: 'npm' });
      expect(defaultTerminology).toContainEqual({ incorrect: 'Github', correct: 'GitHub' });
    });
  });
});
