/**
 * Rightdown configuration types
 */

export interface TerminologyRule {
  incorrect: string;
  correct: string;
  caseSensitive?: boolean;
}

export interface RightdownConfig {
  version: 2;
  preset?: 'strict' | 'standard' | 'relaxed';
  rules?: Record<string, unknown>;
  formatters?: {
    default?: string;
    languages?: Record<string, string>;
  };
  formatterOptions?: Record<string, Record<string, unknown>>;
  ignores?: Array<string>;
  terminology?: Array<TerminologyRule>;
  output?: {
    diagnostics?: boolean;
    progress?: boolean;
    color?: boolean;
  };
}
