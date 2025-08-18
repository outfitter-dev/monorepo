/**

- @outfitter/baselayer - Foundation layer for development tooling
-
- This is the programmatic API for Baselayer.
- For CLI usage, use the `baselayer` command.
 */

// Tool adapters
export {
  MarkdownlintAdapter,
  PrettierAdapter,
  StylelintAdapter,
  SyncpackAdapter,
  UltraciteAdapter,
} from './adapters/index.js';
// Legacy commands (for backward compatibility)
export { clean } from './commands/clean.js';
export { doctor } from './commands/doctor.js';
export { init } from './commands/init.js';
// Core utilities for programmatic usage
export *from './core/index.js';
export { ConfigLoader } from './orchestration/config-loader.js';
export { FileMatcher } from './orchestration/file-matcher.js';
// New orchestration system (primary API)
export { Orchestrator } from './orchestration/orchestrator.js';
// Types - both new and legacy
export type {
  BackupInfo,
  CheckOptions,
  // Legacy types
  CleanOptions,
  CommandOptions,
  DetectionResult,
  DiagnosticReport,
  DoctorOptions,
  FlintConfig,
  FlintError,
  FlintResult,
  FormatOptions,
  InitOptions,
  Issue,
  LintOptions,
  OrchestrationResult,
  // New orchestration types
  OutfitterConfig,
  ToolAdapter,
  ToolResult,
} from './types.js';
// Utilities
export* from './utils/index.js';
