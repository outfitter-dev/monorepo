/**
 * @outfitter/remark-config
 *
 * Shared Remark configuration for consistent Markdown processing across Outfitter projects.
 * Exports presets and utilities for generating remark configurations.
 */

export * from './presets/index.js';
export * from './types.js';

// Re-export individual presets for convenience
export { standard as standardPreset } from './presets/standard.js';
export { strict as strictPreset } from './presets/strict.js';
export { relaxed as relaxedPreset } from './presets/relaxed.js';

// Default export is the standard preset
export { standard as default } from './presets/standard.js';
