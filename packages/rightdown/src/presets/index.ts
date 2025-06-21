import { strict } from './strict';
import { standard } from './standard';
import { relaxed } from './relaxed';
import type { PresetName, MdlintConfig } from '../types.js';

export type { PresetName } from '../types.js';

export interface Preset {
  name: PresetName;
  description: string;
  config: MdlintConfig;
}

const presetMap: Record<PresetName, Preset> = {
  strict,
  standard,
  relaxed,
};

export function getPresetConfig(preset: PresetName): MdlintConfig {
  const presetData = presetMap[preset];
  if (!presetData) {
    return { ...standard.config };
  }
  return { ...presetData.config };
}

// For backwards compatibility
export const presets = {
  strict: { name: strict.name, description: strict.description },
  standard: { name: standard.name, description: standard.description },
  relaxed: { name: relaxed.name, description: relaxed.description },
};

// Re-export individual presets
export { strict, standard, relaxed };
