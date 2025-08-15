import { failure, makeError, type Result, success } from '@outfitter/contracts';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import type {
  CommandOptions,
  FlintError,
  OrchestrationResult,
  ToolResult,
} from '../types.js';
import { AdapterRegistry } from './adapter-registry.js';
import { ConfigLoader } from './config-loader.js';
import { FileMatcher, type FileType } from './file-matcher.js';

/**
 * Core orchestration engine with dynamic configuration support
 * Coordinates multiple tools for parallel execution based on baselayer.jsonc configuration
 */
export class Orchestrator {
  private readonly fileMatcher = new FileMatcher();
  private readonly configLoader = new ConfigLoader();
  private readonly adapterRegistry = new AdapterRegistry();
  private currentConfig: BaselayerConfig | null = null;

  /**
   * Initialize orchestrator with configuration
   * Must be called before using format/lint/check methods
   */
  async initialize(
    cwd: string = process.cwd()
  ): Promise<Result<void, FlintError>> {
    const configResult = await this.configLoader.loadConfig(cwd);
    if (configResult.success === false) {
      return failure(configResult.error);
    }

    this.currentConfig = configResult.data;

    // Configure dynamic adapters based on loaded configuration
    this.adapterRegistry.configure(this.currentConfig);

    // Update file matcher with configuration
    this.fileMatcher.updateHandlers(this.currentConfig);

    return success(undefined);
  }

  /**
   * Format files using appropriate tools
   * Uses dynamic configuration to determine which tools are active
   */
  async format(
    patterns: readonly string[],
    options: CommandOptions = {}
  ): Promise<Result<OrchestrationResult, FlintError>> {
    const startTime = Date.now();

    try {
      // Ensure orchestrator is initialized
      if (!this.currentConfig) {
        const initResult = await this.initialize();
        if (initResult.success === false) {
          return failure(initResult.error);
        }
      }

      // Find and categorize files using dynamic configuration
      const findOptions: {
        cwd?: string;
        ignore?: readonly string[];
        onlyStaged?: boolean;
      } = {};
      if (options.staged !== undefined) {
        findOptions.onlyStaged = options.staged;
      }
      const files = await this.fileMatcher.findFiles(patterns, findOptions);

      if (files.length === 0) {
        return success({
          success: true,
          results: [],
          totalFiles: 0,
          totalErrors: 0,
          executionTime: Date.now() - startTime,
        } as OrchestrationResult);
      }

      const categorized = this.fileMatcher.categorizeFiles(
        files,
        this.currentConfig!
      );

      // Filter by --only flag if specified
      const fileTypes = options.only
        ? (options.only as FileType[])
        : (Object.keys(categorized) as FileType[]);

      // Execute tools in parallel - only for types with registered adapters and files
      const tasks = fileTypes
        .filter((type) => this.adapterRegistry.hasAdapter(type))
        .filter((type) => categorized[type].length > 0)
        .map((type) =>
          this.executeToolFormat(type, categorized[type], options)
        );

      const results = await Promise.all(tasks);
      const allResults = results.filter(
        (result): result is ToolResult => result !== null
      );

      // Calculate totals
      const totalFiles = allResults.reduce(
        (sum, result) => sum + result.filesProcessed,
        0
      );
      const totalErrors = allResults.reduce(
        (sum, result) => sum + result.errors.length,
        0
      );
      const operationSuccess = allResults.every((result) => result.success);

      return success({
        success: operationSuccess,
        results: allResults,
        totalFiles,
        totalErrors,
        executionTime: Date.now() - startTime,
      } as OrchestrationResult);
    } catch (error) {
      return failure(
        makeError(
          'INTERNAL_ERROR',
          `Format orchestration failed: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Lint files using appropriate tools
   * Uses dynamic configuration to determine which tools are active
   */
  async lint(
    patterns: readonly string[],
    options: CommandOptions = {}
  ): Promise<Result<OrchestrationResult, FlintError>> {
    const startTime = Date.now();

    try {
      // Ensure orchestrator is initialized
      if (!this.currentConfig) {
        const initResult = await this.initialize();
        if (initResult.success === false) {
          return failure(initResult.error);
        }
      }

      // Find and categorize files using dynamic configuration
      const findOptions: {
        cwd?: string;
        ignore?: readonly string[];
        onlyStaged?: boolean;
      } = {};
      if (options.staged !== undefined) {
        findOptions.onlyStaged = options.staged;
      }
      const files = await this.fileMatcher.findFiles(patterns, findOptions);

      if (files.length === 0) {
        return success({
          success: true,
          results: [],
          totalFiles: 0,
          totalErrors: 0,
          executionTime: Date.now() - startTime,
        } as OrchestrationResult);
      }

      const categorized = this.fileMatcher.categorizeFiles(
        files,
        this.currentConfig!
      );

      // Filter by --only flag if specified
      const fileTypes = options.only
        ? (options.only as FileType[])
        : (Object.keys(categorized) as FileType[]);

      // Execute tools in parallel - only for types with registered adapters and files
      const tasks = fileTypes
        .filter((type) => this.adapterRegistry.hasAdapter(type))
        .filter((type) => categorized[type].length > 0)
        .map((type) => this.executeToolLint(type, categorized[type], options));

      const results = await Promise.all(tasks);
      const allResults = results.filter(
        (result): result is ToolResult => result !== null
      );

      // Calculate totals
      const totalFiles = allResults.reduce(
        (sum, result) => sum + result.filesProcessed,
        0
      );
      const totalErrors = allResults.reduce(
        (sum, result) => sum + result.errors.length,
        0
      );
      const operationSuccess = allResults.every((result) => result.success);

      return success({
        success: operationSuccess,
        results: allResults,
        totalFiles,
        totalErrors,
        executionTime: Date.now() - startTime,
      } as OrchestrationResult);
    } catch (error) {
      return failure(
        makeError(
          'INTERNAL_ERROR',
          `Lint orchestration failed: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Check files (lint + format check)
   */
  async check(
    patterns: readonly string[],
    options: CommandOptions = {}
  ): Promise<Result<OrchestrationResult, FlintError>> {
    // For check, we run lint without fix to ensure all issues are caught
    const checkOptions = { ...options, fix: false };
    return this.lint(patterns, checkOptions);
  }

  /**
   * Execute formatting for specific file type using dynamic adapter registry
   */
  private async executeToolFormat(
    fileType: FileType,
    files: string[],
    options: CommandOptions
  ): Promise<ToolResult | null> {
    const adapter = this.adapterRegistry.getAdapter(fileType);
    if (!adapter) {
      return null;
    }

    try {
      return await adapter.format(files, {
        fix: options.fix ?? true,
        staged: options.staged,
        dryRun: options.dryRun,
      });
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [`${adapter.name} format failed: ${(error as Error).message}`],
        exitCode: 1,
        filesProcessed: files.length,
        tool: adapter.name,
      };
    }
  }

  /**
   * Execute linting for specific file type using dynamic adapter registry
   */
  private async executeToolLint(
    fileType: FileType,
    files: string[],
    options: CommandOptions
  ): Promise<ToolResult | null> {
    const adapter = this.adapterRegistry.getAdapter(fileType);
    if (!adapter) {
      return null;
    }

    try {
      return await adapter.lint(files, {
        fix: options.fix ?? false,
        staged: options.staged,
        checkOnly: !options.fix,
      });
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [`${adapter.name} lint failed: ${(error as Error).message}`],
        exitCode: 1,
        filesProcessed: files.length,
        tool: adapter.name,
      };
    }
  }

  /**
   * Get current configuration (for external access)
   */
  getCurrentConfig(): BaselayerConfig | null {
    return this.currentConfig;
  }

  /**
   * Get adapter registry (for debugging and introspection)
   */
  getAdapterRegistry(): AdapterRegistry {
    return this.adapterRegistry;
  }

  /**
   * Get file matcher (for debugging and introspection)
   */
  getFileMatcher(): FileMatcher {
    return this.fileMatcher;
  }

  /**
   * Force reconfigure adapters with new configuration
   * Useful for runtime configuration changes
   */
  async reconfigure(config: BaselayerConfig): Promise<void> {
    this.currentConfig = config;
    this.adapterRegistry.configure(config);
    this.fileMatcher.updateHandlers(config);
  }

  /**
   * Get orchestration summary for debugging
   */
  getSummary(): {
    configLoaded: boolean;
    adapters: ReturnType<AdapterRegistry['getSummary']>;
    fileHandlers: Record<FileType, readonly string[]>;
  } {
    return {
      configLoaded: this.currentConfig !== null,
      adapters: this.adapterRegistry.getSummary(),
      fileHandlers: this.fileMatcher.getActiveHandlers(),
    };
  }
}
