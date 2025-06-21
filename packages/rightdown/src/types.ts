// Shared types for rightdown

export type RuleValue = boolean | string | number | { [key: string]: RuleValue };

// The actual markdownlint configuration structure
export interface MdlintConfig {
  [key: string]:
    | RuleValue
    | string
    | null
    | boolean
    | Array<string>
    | Array<{ incorrect: string; correct: string }>
    | undefined;
  extends?: string | null;
  default?: boolean;
  terminology?: Array<{ incorrect: string; correct: string }>;
  customRules?: Array<string>;
  ignores?: Array<string>;
}

// Options passed to generateConfig
export interface GeneratorOptions {
  preset?: PresetName;
  terminology?: Array<{ incorrect: string; correct: string }>;
  customRules?: Array<string>;
  ignores?: Array<string>;
}

export type PresetName = 'strict' | 'standard' | 'relaxed';
