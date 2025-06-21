/**
 * Lightweight terminal colors utility
 * Replaces chalk dependency with native ANSI codes
 */

export const colors = {
  // Reset
  reset: '\x1b[0m',

  // Text colors
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text: string) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  white: (text: string) => `\x1b[37m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,

  // Text styles
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
  italic: (text: string) => `\x1b[3m${text}\x1b[0m`,
  underline: (text: string) => `\x1b[4m${text}\x1b[0m`,

  // Semantic colors
  success: (text: string) => `\x1b[32m${text}\x1b[0m`,
  error: (text: string) => `\x1b[31m${text}\x1b[0m`,
  warning: (text: string) => `\x1b[33m${text}\x1b[0m`,
  info: (text: string) => `\x1b[36m${text}\x1b[0m`,
} as const;

/**
 * Check if colors should be disabled
 * Respects NO_COLOR environment variable and TTY detection
 */
export function shouldUseColors(): boolean {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  return process.stdout.isTTY;
}

/**
 * Conditionally apply colors based on environment
 */
export function colorize<T extends keyof typeof colors>(color: T, text: string): string {
  if (!shouldUseColors()) return text;
  return colors[color](text);
}
