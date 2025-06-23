/**
 * Language normalization utilities
 */

/**
 * Normalize language identifier to standard names
 */
export function normalizeLanguage(language: string): string {
  const aliases: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'javascript',
    tsx: 'typescript',
    yml: 'yaml',
    md: 'markdown',
  };

  return aliases[language.toLowerCase()] || language.toLowerCase();
}