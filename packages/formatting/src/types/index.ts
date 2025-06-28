/**
 * Re-export all types from schemas
 * This provides backward compatibility while using Zod for validation
 */

export type {
  FormatterType,
  FormatterLocation,
  FormatterDetection,
  FormatterDetectionResult,
  PresetName,
  IndentationStyle,
  QuoteStyle,
  SemicolonStyle,
  TrailingCommaStyle,
  ArrowParensStyle,
  EndOfLineStyle,
  PresetConfig,
  SetupOptions,
  GeneratedConfig,
  SetupResult,
  CLISetupOptions,
  PackageJson,
} from '../schemas/index.js';

/**
 * DevContainer configuration
 */
export interface DevContainerConfig {
  name: string;
  image: string;
  features?: Record<string, Record<string, any>>;
  customizations?: {
    vscode?: {
      extensions?: Array<string>;
      settings?: Record<string, any>;
    };
  };
  postCreateCommand?: string;
  remoteUser?: string;
  mounts?: Array<string>;
}
