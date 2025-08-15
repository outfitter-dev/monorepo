import { MarkdownlintAdapter } from '../adapters/markdownlint-adapter.js';
// Import all available adapters
import { PrettierAdapter } from '../adapters/prettier-adapter.js';
import { StylelintAdapter } from '../adapters/stylelint-adapter.js';
import { UltraciteAdapter } from '../adapters/ultracite-adapter.js';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import type { ToolAdapter } from '../types.js';
import type { FileType } from './file-matcher.js';
// import { LefthookAdapter } from '../adapters/lefthook-adapter.js';

/**
 * Registry for dynamically managing tool adapters based on configuration
 */
export class AdapterRegistry {
  private adapters = new Map<FileType, ToolAdapter>();
  private currentConfig: BaselayerConfig | null = null;

  /**
   * Configure adapters based on baselayer.jsonc configuration
   * Dynamically registers/skips adapters based on enabled features
   */
  configure(config: BaselayerConfig): void {
    this.currentConfig = config;
    this.adapters.clear();

    // Core TypeScript/JavaScript handling (always enabled when typescript feature is on)
    if (config.features?.typescript !== false) {
      this.adapters.set('typescript', new UltraciteAdapter());
    }

    // JSON/YAML handling - Prettier is the base handler
    // When other tools are disabled, Prettier expands to handle their files
    if (config.features?.json !== false) {
      const prettierAdapter = new PrettierAdapter();

      // Configure Prettier with dynamic file extensions based on disabled tools
      const additionalExtensions: string[] = [];

      if (config.features?.styles === false) {
        additionalExtensions.push('.css', '.scss', '.sass', '.less');
      }

      if (config.features?.markdown === false) {
        additionalExtensions.push('.md', '.mdx', '.mdc');
      }

      // Apply dynamic extensions to Prettier
      if (additionalExtensions.length > 0) {
        this.configurePrettierAdapter(prettierAdapter, additionalExtensions);
      }

      this.adapters.set('json', prettierAdapter);
    }

    // Stylelint for CSS (only when enabled)
    if (config.features?.styles === true) {
      this.adapters.set('css', new StylelintAdapter());
    }

    // Markdownlint (only when enabled)
    if (config.features?.markdown === true) {
      this.adapters.set('markdown', new MarkdownlintAdapter());
    }

    // Git hooks via Lefthook (when commits feature enabled)
    if (config.features?.commits === true) {
      // Note: Lefthook doesn't handle specific file types but is configured here for completeness
      // It's handled separately in the orchestration logic
    }
  }

  /**
   * Get adapter for specific file type
   */
  getAdapter(fileType: FileType): ToolAdapter | undefined {
    return this.adapters.get(fileType);
  }

  /**
   * Get all registered adapters
   */
  getAllAdapters(): Array<{ fileType: FileType; adapter: ToolAdapter }> {
    return Array.from(this.adapters.entries()).map(([fileType, adapter]) => ({
      fileType,
      adapter,
    }));
  }

  /**
   * Check if a file type has an active adapter
   */
  hasAdapter(fileType: FileType): boolean {
    return this.adapters.has(fileType);
  }

  /**
   * Get configuration-specific overrides for a tool
   */
  getToolOverrides<T = Record<string, unknown>>(
    toolName: keyof NonNullable<BaselayerConfig['overrides']>
  ): T | undefined {
    if (!this.currentConfig?.overrides?.[toolName]) {
      return;
    }
    return this.currentConfig.overrides[toolName] as T;
  }

  /**
   * Apply tool-specific configuration overrides to adapters
   */
  private configurePrettierAdapter(
    _adapter: PrettierAdapter,
    _additionalExtensions: string[]
  ): void {
    // Extend Prettier's file handling capabilities
    // This would require modifying the adapter's extensions property
    // For now, we document this behavior - the actual extension handling
    // is done at the file categorization level in FileMatcher
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): BaselayerConfig | null {
    return this.currentConfig;
  }

  /**
   * Get adapter summary for debugging
   */
  getSummary(): {
    totalAdapters: number;
    adaptersByType: Record<FileType, string>;
    disabledFeatures: string[];
  } {
    const adaptersByType: Record<FileType, string> = {} as Record<
      FileType,
      string
    >;

    for (const [fileType, adapter] of this.adapters.entries()) {
      adaptersByType[fileType] = adapter.name;
    }

    const disabledFeatures: string[] = [];
    if (this.currentConfig?.features) {
      for (const [feature, enabled] of Object.entries(
        this.currentConfig.features
      )) {
        if (enabled === false) {
          disabledFeatures.push(feature);
        }
      }
    }

    return {
      totalAdapters: this.adapters.size,
      adaptersByType,
      disabledFeatures,
    };
  }
}
