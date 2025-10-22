/**
 * Configuration-related types
 * @module
 */

/**
 * Configuration scope levels
 */
export type ConfigScope = "user" | "workspace" | "project";

/**
 * Supported configuration file formats
 */
export type ConfigFormat = "json" | "yaml" | "toml";

/**
 * Configuration with metadata
 */
export interface ConfigWithMetadata<T> {
  readonly value: T;
  readonly scope: ConfigScope;
  readonly format: ConfigFormat;
  readonly path: string;
}

/**
 * Layered configuration with inheritance
 */
export interface LayeredConfig<T> {
  readonly user?: T;
  readonly workspace?: T;
  readonly project?: T;
}

/**
 * Merge layered configuration following precedence rules
 * project > workspace > user
 */
export type MergedConfig<T> = T extends object
  ? {
      [K in keyof T]: T[K];
    }
  : T;

/**
 * Configuration validation result
 */
export type ConfigValidation<T> =
  | { readonly valid: true; readonly value: T }
  | { readonly valid: false; readonly errors: readonly string[] };
