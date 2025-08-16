import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Console } from '../console';

describe('Console', () => {
  let console: Console;
  let mockLog: typeof console.log;

  beforeEach(() => {
    console = new Console();
    mockLog = vi.spyOn(global.console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log', () => {
    it('should log plain message', () => {
      console.log('test message');
      expect(mockLog).toHaveBeenCalledWith('test message');
    });

    it('should log with indent', () => {
      console.log('test message', { indent: 2 });
      expect(mockLog).toHaveBeenCalledWith('  test message');
    });

    it('should log with prefix', () => {
      console.log('test message', { prefix: '→' });
      expect(mockLog).toHaveBeenCalledWith('→ test message');
    });
  });

  describe('indent/dedent', () => {
    it('should increase indent level', () => {
      console.indent();
      console.log('indented');
      expect(mockLog).toHaveBeenCalledWith('  indented');
    });

    it('should decrease indent level', () => {
      console.indent(4);
      console.dedent(2);
      console.log('dedented');
      expect(mockLog).toHaveBeenCalledWith('  dedented');
    });

    it('should not go below zero indent', () => {
      console.dedent(10);
      console.log('zero indent');
      expect(mockLog).toHaveBeenCalledWith('zero indent');
    });
  });

  describe('formatted messages', () => {
    it('should log success message', () => {
      console.success('operation complete');
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('✅'));
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('operation complete')
      );
    });

    it('should log error message', () => {
      console.error('operation failed');
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('❌'));
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('operation failed')
      );
    });

    it('should log warning message', () => {
      console.warning('be careful');
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('be careful')
      );
    });

    it('should log info message', () => {
      console.info('for your information');
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('ℹ️'));
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('for your information')
      );
    });

    it('should log skip message', () => {
      console.skip('skipping this');
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('⏭️'));
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('skipping this')
      );
    });

    it('should log step message', () => {
      console.step('doing something');
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('→'));
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('doing something')
      );
    });
  });

  describe('title', () => {
    it('should log title with underline', () => {
      console.title('Section Title');
      expect(mockLog).toHaveBeenCalledTimes(3); // empty line, title, underline
      expect(mockLog).toHaveBeenNthCalledWith(1);
      expect(mockLog).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('Section Title')
      );
      expect(mockLog).toHaveBeenNthCalledWith(3, expect.stringContaining('─'));
    });
  });

  describe('section', () => {
    it('should log section header', () => {
      console.section('New Section');
      expect(mockLog).toHaveBeenCalledTimes(2); // empty line, section
      expect(mockLog).toHaveBeenNthCalledWith(1);
      expect(mockLog).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('New Section')
      );
    });
  });

  describe('code', () => {
    it('should log code block', () => {
      console.code('const x = 1;', 'javascript');
      expect(mockLog).toHaveBeenCalledTimes(3);
      expect(mockLog).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('```javascript')
      );
      expect(mockLog).toHaveBeenNthCalledWith(2, 'const x = 1;');
      expect(mockLog).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('```')
      );
    });

    it('should log multiline code', () => {
      console.code('line 1\nline 2', 'typescript');
      expect(mockLog).toHaveBeenCalledTimes(4);
      expect(mockLog).toHaveBeenNthCalledWith(2, 'line 1');
      expect(mockLog).toHaveBeenNthCalledWith(3, 'line 2');
    });
  });

  describe('list', () => {
    it('should log unordered list', () => {
      console.list(['item 1', 'item 2']);
      expect(mockLog).toHaveBeenCalledTimes(2);
      expect(mockLog).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('• item 1')
      );
      expect(mockLog).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('• item 2')
      );
    });

    it('should log ordered list', () => {
      console.list(['first', 'second'], true);
      expect(mockLog).toHaveBeenCalledTimes(2);
      expect(mockLog).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('1. first')
      );
      expect(mockLog).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('2. second')
      );
    });
  });

  describe('progress', () => {
    it('should show progress bar at 0%', () => {
      console.progress(0, 100);
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('[░░░░░░░░░░░░░░░░░░░░] 0%')
      );
    });

    it('should show progress bar at 50%', () => {
      console.progress(50, 100);
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('[██████████░░░░░░░░░░] 50%')
      );
    });

    it('should show progress bar at 100%', () => {
      console.progress(100, 100);
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('[████████████████████] 100%')
      );
    });

    it('should show progress with message', () => {
      console.progress(25, 100, 'Processing files');
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('25% Processing files')
      );
    });
  });

  describe('divider', () => {
    it('should log divider line', () => {
      console.divider();
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('─'.repeat(50))
      );
    });
  });
});
