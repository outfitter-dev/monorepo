import type { Result } from '@outfitter/contracts';

// Core orchestration types
export interface OutfitterConfig {
  /** Feature toggles - all enabled by default */
  features?: {
    typescript?: boolean; // Biome/Ultracite
    markdown?: boolean; // Markdownlint
    styles?: boolean; // Stylelint
    json?: boolean; // Prettier
    commits?: boolean; // Commitlint via Lefthook
    packages?: boolean; // Publint (opt-in for libraries)
  };
  /** Tool-specific overrides only when needed */
  overrides?: {
    biome?: Record<string, unknown>;
    prettier?: Record<string, unknown>;
    stylelint?: Record<string, unknown>;
    markdown?: Record<string, unknown>;
    lefthook?: Record<string, unknown>;
  };
}

export interface ToolAdapter {
  readonly name: string;
  readonly extensions: readonly string[];
  canHandle(filePath: string): boolean;
  format(
    files: readonly string[],
    options?: FormatOptions
  ): Promise<ToolResult>;
  lint(files: readonly string[], options?: LintOptions): Promise<ToolResult>;
  check?(files: readonly string[], options?: CheckOptions): Promise<ToolResult>;
}

export interface FormatOptions {
  fix?: boolean;
  staged?: boolean;
  dryRun?: boolean;
}

export interface LintOptions {
  fix?: boolean;
  staged?: boolean;
  checkOnly?: boolean;
}

export interface CheckOptions {
  fix?: boolean;
  staged?: boolean;
}

export interface ToolResult {
  success: boolean;
  output: string;
  errors: readonly string[];
  exitCode: number;
  filesProcessed: number;
  tool: string;
}

export interface OrchestrationResult {
  success: boolean;
  results: readonly ToolResult[];
  totalFiles: number;
  totalErrors: number;
  executionTime: number;
}

export interface CommandOptions {
  only?: readonly string[]; // Filter to specific file types
  fix?: boolean;
  staged?: boolean; // Only process staged files
  parallel?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
}

// Legacy types for backward compatibility
export interface InitOptions {
  yes?: boolean;
  dryRun?: boolean;
  keepExisting?: boolean;
  noStylelint?: boolean;
  noGitHooks?: boolean;
  monorepo?: boolean;
  keepPrettier?: boolean;
}

export interface CleanOptions {
  force?: boolean;
}

export type DoctorOptions = {};

export interface DetectedConfig {
  tool: string;
  path: string;
  content: string;
}

export interface DetectedTools {
  hasConfigs: boolean;
  configs: DetectedConfig[];
}

export interface DoctorIssue {
  description: string;
  severity: 'error' | 'warning' | 'info';
  fix?: string;
}

export interface DoctorReport {
  issues: DoctorIssue[];
}

export interface DetectionResult {
  hasPackageJson: boolean;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown';
  packageName?: string;
  hasTypeScript: boolean;
  hasReact: boolean;
  hasNext: boolean;
  hasVitest: boolean;
  hasJest: boolean;
  isMonorepo: boolean;
  workspaceType?: 'app' | 'package' | 'tool' | 'config';
}

export interface ToolConfig {
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface FlintConfig {
  tools: {
    biome: ToolConfig;
    prettier: ToolConfig;
    stylelint: ToolConfig;
    markdownlint: ToolConfig;
    commitlint: ToolConfig;
    lefthook: ToolConfig;
    vscode: ToolConfig;
    editorconfig: ToolConfig;
  };
  presets: string[];
  monorepo: boolean;
  packageScripts: boolean;
}

export interface BackupInfo {
  originalPath: string;
  backupPath: string;
  timestamp: string;
}

export interface Issue {
  description: string;
  fix?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface DiagnosticReport {
  issues: Issue[];
  toolsInstalled: Record<string, boolean>;
  configFiles: Record<string, boolean>;
}

export type FlintResult<T> = Result<T, FlintError>;

export interface FlintError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const FlintErrorCodes = {
  CONFIG_INVALID: 'CONFIG_INVALID',
  TOOL_NOT_FOUND: 'TOOL_NOT_FOUND',
  FILE_OPERATION_FAILED: 'FILE_OPERATION_FAILED',
  DEPENDENCY_INSTALL_FAILED: 'DEPENDENCY_INSTALL_FAILED',
  BACKUP_FAILED: 'BACKUP_FAILED',
  MIGRATION_FAILED: 'MIGRATION_FAILED',
} as const;
