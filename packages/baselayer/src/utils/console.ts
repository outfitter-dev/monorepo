/**
 * Console utilities with formatting using picocolors
 */
import * as pc from 'picocolors';

export interface LogOptions {
  indent?: number;
  prefix?: string;
}

export class Console {
  private indentLevel = 0;

  indent(level = 2): void {
    this.indentLevel += level;
  }

  dedent(level = 2): void {
    this.indentLevel = Math.max(0, this.indentLevel - level);
  }

  private getIndent(): string {
    return ' '.repeat(this.indentLevel);
  }

  log(message: string, options?: LogOptions): void {
    const indent = ' '.repeat(options?.indent ?? 0);
    const prefix = options?.prefix ? `${options.prefix} ` : '';
    console.log(`${this.getIndent()}${indent}${prefix}${message}`);
  }

  success(message: string, options?: LogOptions): void {
    this.log(pc.green(`✅ ${message}`), options);
  }

  error(message: string, options?: LogOptions): void {
    this.log(pc.red(`❌ ${message}`), options);
  }

  warning(message: string, options?: LogOptions): void {
    this.log(pc.yellow(`⚠️  ${message}`), options);
  }

  info(message: string, options?: LogOptions): void {
    this.log(pc.blue(`ℹ️  ${message}`), options);
  }

  skip(message: string, options?: LogOptions): void {
    this.log(pc.gray(`⏭️  ${message}`), options);
  }

  step(message: string, options?: LogOptions): void {
    this.log(pc.cyan(`→ ${message}`), options);
  }

  title(message: string): void {
    console.log();
    this.log(pc.bold(pc.cyan(message)));
    this.log(pc.cyan('─'.repeat(message.length)));
  }

  section(message: string): void {
    console.log();
    this.log(pc.bold(message));
  }

  code(code: string, language?: string): void {
    const indent = this.getIndent();
    console.log(
      `${indent}${pc.gray('```')}${language ? pc.gray(language) : ''}`
    );
    code.split('\n').forEach((line) => {
      console.log(`${indent}${line}`);
    });
    console.log(`${indent}${pc.gray('```')}`);
  }

  list(items: string[], ordered = false): void {
    items.forEach((item, index) => {
      const bullet = ordered ? `${index + 1}.` : '•';
      this.log(`${pc.gray(bullet)} ${item}`);
    });
  }

  progress(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.floor(percentage / 5);
    const empty = 20 - filled;
    const bar = `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
    const text = message ? ` ${message}` : '';
    this.log(`${bar} ${percentage}%${text}`);
  }

  divider(): void {
    this.log(pc.gray('─'.repeat(50)));
  }
}

// Export a singleton instance
export const logger = new Console();
